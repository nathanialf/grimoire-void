import { useEffect, useMemo, useRef } from 'react'
import { BackSide, BufferAttribute, CanvasTexture, Euler, ExtrudeGeometry, Group, NearestFilter, Quaternion, SRGBColorSpace, Shape, ShapeGeometry, TextureLoader, Vector3 } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { cartDispenserFixture, toolMountFixture, toolMountRotationY } from './sceneConstants'
import { type Cartridge, useInventory } from '../data/inventory'
import { VARIATIONS } from '../data/variations'
import { REGISTRY_BY_SLUG, hashSlug, titleOf } from '../data'
import { ARTIFACT_PALETTES, lerpHexColor, makeStaticArtifactTexture } from './Scene'
import { renderPixelBitmap } from '../utils/renderPixelBitmap'

// Tool geometry (shared by wall mount + held). Body, grip, scope.
// Body's long axis is +X (muzzle); scope is a low housing across the body
// whose -X (rear) face carries the operator-facing display.
const TOOL_BODY = { w: 0.34, h: 0.09, d: 0.13 } as const
const TOOL_GRIP = { w: 0.06, h: 0.13, d: 0.1 } as const
const TOOL_SCOPE = { w: 0.05, h: 0.07, d: 0.18 } as const
const SCOPE_SCREEN = { w: 0.15, h: 0.05 } as const

const SCOPE_W_PX = 256
const SCOPE_H_PX = 96

const PROGRESS_INCOMPLETE = '#e8202a'
const PROGRESS_COMPLETE = '#3fb86a'

// Total expected scan-node count for a cart slug, summed across every
// variation that binds nodes to it. Mirrors the completion rule in
// MuseumPage's dock trigger but extended across all variations so the
// scope reads accurate progress regardless of which variation the
// player is in.
function totalNodesForSlug(slug: string): number {
  let total = 0
  for (const v of VARIATIONS) {
    for (const n of v.nodes) if (n.slug === slug) total++
  }
  return total
}

interface ScopeState {
  line1: string
  progress: number | null  // null = no bar (empty / unbound cart)
  tone: 'empty' | 'blank' | 'live'
}

// Build the scope screen state from the held cart. Null cart → EMPTY.
// Blank cart (no slug yet) → BLANK with no bar. Bound cart → SLUG +
// progress bar (gathered / total expected for the slug).
function scopeLines(cart: Cartridge | null): ScopeState {
  if (!cart) return { line1: 'EMPTY', progress: null, tone: 'empty' }
  if (cart.slug === null) return { line1: 'BLANK', progress: null, tone: 'blank' }
  const count = Object.values(cart.gathered).filter(Boolean).length
  const total = totalNodesForSlug(cart.slug)
  const progress = total > 0 ? Math.min(1, count / total) : 0
  return { line1: cart.slug.toUpperCase(), progress, tone: 'live' }
}

function paintScope(
  ctx: CanvasRenderingContext2D,
  line1: string,
  progress: number | null,
  tone: 'empty' | 'blank' | 'live',
): void {
  // Recess background fills the whole display; the progress fill paints
  // over it from the left edge so the bar IS the back panel.
  ctx.fillStyle = '#0e0e0e'
  ctx.fillRect(0, 0, SCOPE_W_PX, SCOPE_H_PX)
  if (progress !== null && progress > 0) {
    ctx.fillStyle = progress >= 1 ? PROGRESS_COMPLETE : PROGRESS_INCOMPLETE
    ctx.fillRect(0, 0, Math.round(SCOPE_W_PX * progress), SCOPE_H_PX)
  }

  // Title sits centered over the bar. A black stroke under the fill keeps
  // it legible whether it's over the dark recess, the red fill, or the
  // green completion fill.
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.font = '900 30px "JetBrains Mono", ui-monospace, monospace'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 5
  ctx.strokeStyle = '#000'
  ctx.strokeText(line1, SCOPE_W_PX / 2, SCOPE_H_PX / 2)
  ctx.fillStyle = tone === 'empty' ? '#cfcfcf' : tone === 'blank' ? '#ffd980' : '#ffffff'
  ctx.fillText(line1, SCOPE_W_PX / 2, SCOPE_H_PX / 2)

  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  for (let y = 0; y < SCOPE_H_PX; y += 2) ctx.fillRect(0, y, SCOPE_W_PX, 1)
}

function makeScopeTexture(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; tex: CanvasTexture } {
  const canvas = document.createElement('canvas')
  canvas.width = SCOPE_W_PX
  canvas.height = SCOPE_H_PX
  const ctx = canvas.getContext('2d')!
  const tex = new CanvasTexture(canvas)
  tex.magFilter = NearestFilter
  tex.minFilter = NearestFilter
  tex.generateMipmaps = false
  tex.colorSpace = SRGBColorSpace
  return { canvas, ctx, tex }
}

// Renderable tool body, used by both the wall-mounted prop and the held
// version. `screenTex` is the scope's screen — wall-mount supplies a
// static EMPTY texture; held tool supplies a live one driven by inventory.
function ToolModel({ screenTex }: { screenTex: CanvasTexture }) {
  return (
    <group>
      {/* Same color/material recipe as the museum's pedestals so the
          recording tool reads as part of the same fixture family
          regardless of which pedestal the player just walked past. */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[TOOL_BODY.w, TOOL_BODY.h, TOOL_BODY.d]} />
        <meshStandardMaterial
          color="#e8e4dc"
          roughness={0.95}
          metalness={0}
          emissive="#1a1814"
          emissiveIntensity={8}
        />
      </mesh>
      {/* Grip */}
      <mesh position={[-TOOL_BODY.w / 2 + TOOL_GRIP.w / 2 + 0.04, -TOOL_BODY.h / 2 - TOOL_GRIP.h / 2 + 0.005, 0]}>
        <boxGeometry args={[TOOL_GRIP.w, TOOL_GRIP.h, TOOL_GRIP.d]} />
        <meshStandardMaterial
          color="#e8e4dc"
          roughness={0.95}
          metalness={0}
          emissive="#1a1814"
          emissiveIntensity={8}
        />
      </mesh>
      {/* Scope housing on top of the body, centered along X so its rear
          face spans the full lateral run of the tool. */}
      <mesh position={[0, TOOL_BODY.h / 2 + TOOL_SCOPE.h / 2 - 0.005, 0]}>
        <boxGeometry args={[TOOL_SCOPE.w, TOOL_SCOPE.h, TOOL_SCOPE.d]} />
        <meshStandardMaterial
          color="#e8e4dc"
          roughness={0.95}
          metalness={0}
          emissive="#1a1814"
          emissiveIntensity={8}
        />
      </mesh>
      {/* Scope screen — mounted on the rear (-X) face of the scope housing
          so it reads back toward the operator when the muzzle points
          forward. Plane normal +Z is rotated to -X by Ry(-π/2). */}
      <mesh
        position={[
          -TOOL_SCOPE.w / 2 - 0.001,
          TOOL_BODY.h / 2 + TOOL_SCOPE.h / 2 - 0.005,
          0,
        ]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[SCOPE_SCREEN.w, SCOPE_SCREEN.h]} />
        <meshBasicMaterial map={screenTex} toneMapped={false} />
      </mesh>
      {/* Muzzle — small block on the front face, signals the scan emitter. */}
      <mesh position={[TOOL_BODY.w / 2 + 0.025, 0, 0]}>
        <boxGeometry args={[0.05, TOOL_BODY.h * 0.6, TOOL_BODY.d * 0.55]} />
        <meshStandardMaterial color="#8a8f99" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  )
}

// Tool wall-mounted on the +X (east) side wall. No rack/pegs — the tool
// sits directly against the wall, its long axis parallel to the wall
// (along world Z after the wrapping group's -π/2 Y rotation).
export function ToolWallMount() {
  const inv = useInventory()
  const f = toolMountFixture

  // Static EMPTY scope texture for the wall display — repainted once on
  // mount, then never updated.
  const { ctx, tex } = useMemo(() => makeScopeTexture(), [])
  useEffect(() => {
    paintScope(ctx, 'EMPTY', null, 'empty')
    tex.needsUpdate = true
  }, [ctx, tex])

  if (inv.tool.equipped) return null

  return (
    <group position={f.center} rotation={[0, toolMountRotationY, 0]}>
      <ToolModel screenTex={tex} />
    </group>
  )
}

// Held aperture's resting transform in camera-local space.
const HELD_REST_POS: [number, number, number] = [0.22, -0.18, -0.5]
const HELD_REST_ROT: [number, number, number] = [0, Math.PI / 2 + 0.15, -0.04]

// Pickup animation duration. Long enough to read as a deliberate flight,
// short enough not to gate the next interaction.
const PICKUP_DURATION_MS = 550

// Pose buffers reused inside useFrame so the per-frame work doesn't
// allocate. Wall transform is fixed in world space; the camera-local
// derivation happens each frame (the camera can rotate during pickup).
const wallWorldPos = new Vector3(...toolMountFixture.center)
const wallWorldQuat = new Quaternion().setFromEuler(new Euler(0, toolMountRotationY, 0))
const restPos = new Vector3(...HELD_REST_POS)
const restQuat = new Quaternion().setFromEuler(new Euler(...HELD_REST_ROT))

// Held tool — camera-parented so it follows the view 1:1. Renders nothing
// until the player picks the tool up. Lives at the top level of the
// Canvas (not inside the museum/carcosa visibility groups) so it persists
// across scene swaps without re-mounting.
export function HeldTool() {
  const inv = useInventory()
  const { camera, scene } = useThree()
  const groupRef = useRef<Group>(null)
  const { ctx, tex } = useMemo(() => makeScopeTexture(), [])
  // Pickup-flight animation: timestamp of the false→true equipped flip,
  // null once the flight is complete. Per-frame interpolation lives in
  // useFrame below.
  const pickupRef = useRef<{ startTime: number } | null>(null)
  const prevEquippedRef = useRef(inv.tool.equipped)
  // Scratch buffers reused inside useFrame.
  const tmpPos = useMemo(() => new Vector3(), [])
  const tmpQuat = useMemo(() => new Quaternion(), [])

  // Target scope state derived from the cart; the rendered progress
  // catches up via per-frame lerp so newly-recorded fragments slide the
  // bar in instead of snapping. Refs (not state) so updating the target
  // doesn't re-run the camera-attachment effect below.
  const targetRef = useRef<ScopeState>(scopeLines(inv.cart))
  const animRef = useRef<number>(targetRef.current.progress ?? 0)
  const lastPaintedRef = useRef<{ line1: string; tone: ScopeState['tone']; bar: number; hasBar: boolean; complete: boolean }>({
    line1: '',
    tone: 'empty',
    bar: -1,
    hasBar: false,
    complete: false,
  })

  useEffect(() => {
    targetRef.current = scopeLines(inv.cart)
  }, [inv.cart])

  // Capture the pickup edge: when equipped goes false→true, kick off a
  // flight from the wall mount to the resting held pose. Skip the
  // animation when the player already had it equipped on mount (e.g.
  // restoring across a scene swap) so we don't replay it.
  useEffect(() => {
    if (inv.tool.equipped && !prevEquippedRef.current) {
      pickupRef.current = { startTime: performance.now() }
      // Seed the held group at the wall transform (camera-local) so the
      // first rendered frame doesn't flash the resting pose before the
      // flight useFrame runs.
      const group = groupRef.current
      if (group) {
        tmpPos.copy(wallWorldPos)
        camera.worldToLocal(tmpPos)
        group.position.copy(tmpPos)
        // Wall-world quaternion expressed in camera-local space: q_local
        // = q_camera⁻¹ · q_world. The camera's quaternion is its world
        // orientation since the camera lives at scene root.
        tmpQuat.copy(camera.quaternion).invert().multiply(wallWorldQuat)
        group.quaternion.copy(tmpQuat)
      }
    }
    prevEquippedRef.current = inv.tool.equipped
  }, [inv.tool.equipped, camera, tmpPos, tmpQuat])

  // Per-frame flight interpolation. Pose the camera-parented group so
  // its world transform tracks lerp(wall_world, held_world(camera_now))
  // — i.e. the aperture flies through world space from the wall to
  // wherever the player's hand currently is, even if they're turning
  // during the pickup. Snaps to rest pose once the flight completes.
  useFrame(() => {
    const group = groupRef.current
    if (!group) return
    const pickup = pickupRef.current
    if (!pickup) return
    const elapsed = performance.now() - pickup.startTime
    if (elapsed >= PICKUP_DURATION_MS) {
      group.position.copy(restPos)
      group.quaternion.copy(restQuat)
      pickupRef.current = null
      return
    }
    const u = elapsed / PICKUP_DURATION_MS
    // Ease-out cubic: fast initial pull, gentle settle into the hand.
    const eased = 1 - Math.pow(1 - u, 3)
    // Wall transform expressed in the camera's local frame this frame.
    tmpPos.copy(wallWorldPos)
    camera.worldToLocal(tmpPos)
    group.position.copy(tmpPos).lerp(restPos, eased)
    tmpQuat.copy(camera.quaternion).invert().multiply(wallWorldQuat)
    group.quaternion.copy(tmpQuat).slerp(restQuat, eased)
  })

  useFrame((_, dt) => {
    const t = targetRef.current
    const targetVal = t.progress ?? 0
    // Critically-damped-ish exponential approach: speed picks the time
    // constant — ~5 reaches 95% of the gap in ~0.6s, which feels
    // present without dragging.
    const k = 1 - Math.exp(-dt * 5)
    animRef.current += (targetVal - animRef.current) * k
    if (Math.abs(targetVal - animRef.current) < 0.001) animRef.current = targetVal

    const last = lastPaintedRef.current
    const renderedBar = Math.round(animRef.current * SCOPE_W_PX)
    const hasBar = t.progress !== null
    // Check the completion threshold separately from the rendered pixel
    // count: at 100% the bar width is identical for animRef 0.999 vs 1.0,
    // but the fill color flips red→green and we need a repaint for that.
    const complete = hasBar && animRef.current >= 1
    const shapeChanged =
      last.line1 !== t.line1 ||
      last.tone !== t.tone ||
      last.hasBar !== hasBar ||
      last.complete !== complete
    if (!shapeChanged && renderedBar === last.bar) return
    paintScope(ctx, t.line1, hasBar ? animRef.current : null, t.tone)
    tex.needsUpdate = true
    lastPaintedRef.current = { line1: t.line1, tone: t.tone, bar: renderedBar, hasBar, complete }
  })

  // Parent the tool group to the camera so its world transform follows
  // the camera automatically (post-controls update). Also ensure the
  // camera itself is in the scene graph so descendants render.
  useEffect(() => {
    if (!inv.tool.equipped) return
    const group = groupRef.current
    if (!group) return
    if (!camera.parent) scene.add(camera)
    camera.add(group)
    return () => {
      camera.remove(group)
    }
  }, [camera, scene, inv.tool.equipped])

  if (!inv.tool.equipped) return null

  // Lower-right framing. Ry(π/2) sends the model's +X (muzzle) to camera
  // -Z so the aperture points forward; the small extra yaw brings the
  // muzzle inward toward the centerline, and the roll gives the held
  // pose a hint of slack. Screen normal -X then maps to camera +Z, so
  // the display faces the camera. Subtle scale keeps FPS proportions.
  return (
    <group ref={groupRef} position={[0.22, -0.18, -0.5]} rotation={[0, Math.PI / 2 + 0.15, -0.04]} scale={0.7}>
      <ToolModel screenTex={tex} />
    </group>
  )
}

// ── Held cart ──
//
// The cart the player is currently carrying, shown plugged into the
// underside of the held aperture. Loaded position is in camera-local
// space so the cart tracks the view 1:1 like the aperture does.
// Geometry is the same chamfered-rectangle silhouette pedestal carts
// use, but the held cart stays *blank* (untextured casing only) until
// it gets docked — first scan binds its slug but not its art, since
// the player only sees a sliver of it inserted into the barrel.

const CART_W = 0.22
const CART_H = 0.32
const CART_D = 0.025
const CART_BAR_W = 0.04
const CART_BAR_D = CART_D + 0.012
// Loaded pose is camera-local. Cart hangs vertically below the
// aperture: chamfered "top" (+Y end) points at the floor, the bottom
// (-Y end) points up into the underside of the barrel — reads as a
// magazine plugged into the receiver from below. Y rotation keeps the
// broad face presented to the camera's left so the narrow edge stays
// vertical-in-view; only the long axis swings from horizontal to
// vertical compared to the muzzle-aligned variant.
const CART_LOADED_POS: [number, number, number] = [0.22, -0.32, -0.6]
const CART_LOADED_ROT: [number, number, number] = [Math.PI, -Math.PI / 2, 0]
const CART_DISPENSE_DURATION_MS = 720

// Dispenser emit point in world space — the front face of the
// dispenser fixture (which is rotated -π/2 around Y, so its "front"
// faces -X / room interior). Pull the cart out a few cm past the
// face so the launch isn't clipped through the cabinet.
const DISPENSER_EMIT_WORLD = new Vector3(
  cartDispenserFixture.center[0] - cartDispenserFixture.size[0] / 2 - 0.04,
  cartDispenserFixture.center[1],
  cartDispenserFixture.center[2],
)

// Build the chamfered-rectangle silhouette + UV-mapped face planes.
// Same geometry recipe pedestal carts use (see ChipPanel in Scene.tsx)
// so a held cart and a docked cart read as the same physical object.
function buildCartShape(): Shape {
  const cornerW = CART_W * 0.24
  const cornerH = CART_H * 0.10
  const shape = new Shape()
  shape.moveTo(-CART_W / 2, 0)
  shape.lineTo(CART_W / 2, 0)
  shape.lineTo(CART_W / 2, CART_H - cornerH)
  shape.lineTo(CART_W / 2 - cornerW, CART_H)
  shape.lineTo(-CART_W / 2 + cornerW, CART_H)
  shape.lineTo(-CART_W / 2, CART_H - cornerH)
  shape.lineTo(-CART_W / 2, 0)
  return shape
}

function buildCartBodyGeometry(): ExtrudeGeometry {
  const body = new ExtrudeGeometry(buildCartShape(), { depth: CART_D, bevelEnabled: false })
  body.translate(0, -CART_H / 2, -CART_D / 2)
  return body
}

function buildCartFaceGeometry(flipU: boolean): ShapeGeometry {
  const g = new ShapeGeometry(buildCartShape())
  const pos = g.attributes.position
  const uvs = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + CART_W / 2) / CART_W
    uvs[i * 2 + 0] = flipU ? 1 - u : u
    uvs[i * 2 + 1] = pos.getY(i) / CART_H
  }
  g.setAttribute('uv', new BufferAttribute(uvs, 2))
  g.translate(0, -CART_H / 2, 0)
  return g
}

// Renders the cart body. When `slug` is null (blank cart, fresh from
// the dispenser) it's just an off-white casing matching the aperture's
// fixture-family color. Once a slug binds (first scan), we look up the
// doc's seed/name and paint the same accent-colored body + tiled face
// art + spine title that pedestal carts use, so the inserted cart
// reads as canonized art rather than a blank shell.
function CartArt({ slug }: { slug: string | null }) {
  const bodyGeo = useMemo(() => buildCartBodyGeometry(), [])

  const entry = slug ? REGISTRY_BY_SLUG.get(slug) : undefined
  if (!slug || !entry) {
    return (
      <mesh geometry={bodyGeo}>
        <meshStandardMaterial
          color="#e8e4dc"
          roughness={0.55}
          metalness={0}
          emissive="#1a1814"
          emissiveIntensity={4}
        />
      </mesh>
    )
  }

  return <CartArtTextured slug={entry.data.slug} bodyGeo={bodyGeo} />
}

// Split out so the texture-building hooks only run when there's a
// real entry (preserves hook order across the slug=null branch).
function CartArtTextured({ slug, bodyGeo }: { slug: string; bodyGeo: ExtrudeGeometry }) {
  const entry = REGISTRY_BY_SLUG.get(slug)!
  const seed = entry.data.museum?.cartridge?.seed ?? hashSlug(entry.data.slug)
  const name = (entry.data.museum?.cartridge?.label ?? titleOf(entry.data)).toUpperCase()

  const palette = seed === 5
    ? { base: '#ffffff', ink: '#0a141a', accent: '#9ec8c2' }
    : ARTIFACT_PALETTES[seed % ARTIFACT_PALETTES.length]
  const casingColor = palette.accent

  const { faceGeo, backFaceGeo } = useMemo(() => ({
    faceGeo: buildCartFaceGeometry(false),
    backFaceGeo: buildCartFaceGeometry(true),
  }), [])

  const cartPop = lerpHexColor(palette.accent, '#ffffff', 0.5)
  const cartPalette = { base: palette.accent, ink: '#000000', accent: cartPop }
  const frontTex = useMemo(
    () => makeStaticArtifactTexture(seed, {
      ombre: true, cellsX: 44, pixel: 18, aspect: CART_H / CART_W, palette: cartPalette,
    }),
    [seed, palette.accent],
  )
  const backTex = useMemo(
    () => makeStaticArtifactTexture(seed + 7777, {
      ombre: true, cellsX: 44, pixel: 18, aspect: CART_H / CART_W, palette: cartPalette,
    }),
    [seed, palette.accent],
  )

  const { titleTex, titleAspect } = useMemo(() => {
    const result = renderPixelBitmap({
      lines: [name],
      font: '900 17px "Playfair Display", Georgia, serif',
      renderSize: 17,
      lineHeight: 1.05,
      align: 'left',
      color: '#ffffff',
      alphaThreshold: 80,
    })
    const tex = new TextureLoader().load(result.dataUrl)
    tex.magFilter = NearestFilter
    tex.minFilter = NearestFilter
    tex.generateMipmaps = false
    tex.colorSpace = SRGBColorSpace
    return { titleTex: tex, titleAspect: result.displayHeight / result.displayWidth }
  }, [name])

  const maxTextWorldH = CART_BAR_W * 0.75
  const maxTextWorldW = CART_H * 0.88
  let textWorldH = Math.min(maxTextWorldH, maxTextWorldW * titleAspect)
  if (textWorldH <= 0) textWorldH = maxTextWorldH
  const textWorldW = textWorldH / Math.max(titleAspect, 1e-6)

  const barCenterX = -CART_W / 2 + CART_BAR_W / 2

  return (
    <>
      <mesh geometry={bodyGeo}>
        <meshStandardMaterial color={casingColor} roughness={0.55} metalness={0} />
      </mesh>
      <mesh geometry={faceGeo} position={[0, 0, CART_D / 2 + 0.0005]}>
        <meshStandardMaterial map={frontTex} roughness={0.85} metalness={0} />
      </mesh>
      <mesh geometry={backFaceGeo} position={[0, 0, -CART_D / 2 - 0.0005]}>
        <meshStandardMaterial map={backTex} side={BackSide} roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[barCenterX, 0, 0]} renderOrder={1}>
        <boxGeometry args={[CART_BAR_W, CART_H, CART_BAR_D]} />
        <meshStandardMaterial
          color="#000000"
          roughness={0.7}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      <mesh position={[barCenterX, 0, CART_BAR_D / 2 + 0.002]} rotation={[0, 0, Math.PI / 2]} renderOrder={2}>
        <planeGeometry args={[textWorldW, textWorldH]} />
        <meshBasicMaterial
          map={titleTex}
          transparent
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
      <mesh position={[barCenterX, 0, -CART_BAR_D / 2 - 0.002]} rotation={[0, Math.PI, -Math.PI / 2]} renderOrder={2}>
        <planeGeometry args={[textWorldW, textWorldH]} />
        <meshBasicMaterial
          map={titleTex}
          transparent
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
    </>
  )
}

interface HeldCartProps {
  // Timestamp set by MuseumPage when the player just dispensed a
  // blank cart from the dispenser. The cart flies from the dispenser
  // into the aperture barrel; partial-cart pickups (no signal) snap
  // straight into the loaded pose.
  dispenseAt: number | null
}

export function HeldCart({ dispenseAt }: HeldCartProps) {
  const inv = useInventory()
  const { camera, scene } = useThree()
  const groupRef = useRef<Group>(null)
  // Animation start timestamp (perf clock). Null when not animating.
  const animRef = useRef<number | null>(null)
  const tmpVec = useMemo(() => new Vector3(), [])
  const loadedVec = useMemo(() => new Vector3(...CART_LOADED_POS), [])

  // Trigger the dispense animation when MuseumPage bumps `dispenseAt`.
  // We don't fire on partial-pickups — those leave dispenseAt
  // unchanged and the cart appears already-loaded next frame.
  useEffect(() => {
    if (dispenseAt === null) return
    animRef.current = dispenseAt
  }, [dispenseAt])

  // Same camera-attachment pattern as the held aperture so the cart
  // rides the view across scene swaps without re-mounting.
  useEffect(() => {
    if (!inv.cart) return
    const group = groupRef.current
    if (!group) return
    if (!camera.parent) scene.add(camera)
    camera.add(group)
    return () => {
      camera.remove(group)
    }
  }, [camera, scene, inv.cart])

  useFrame(() => {
    const group = groupRef.current
    if (!group || !inv.cart) return
    const start = animRef.current
    if (start === null) {
      // No animation pending — sit at the loaded pose.
      group.position.copy(loadedVec)
      group.rotation.set(...CART_LOADED_ROT)
      return
    }
    const elapsed = performance.now() - start
    const u = Math.min(1, elapsed / CART_DISPENSE_DURATION_MS)
    // Ease-out cubic: quick draw out of the dispenser, gentle
    // settle into the barrel.
    const eased = 1 - Math.pow(1 - u, 3)
    // Each frame, re-express the dispenser emit point in the camera's
    // current local frame. As the player moves/looks during the
    // animation the cart's world trajectory still ends at the
    // aperture, not at a stale camera anchor.
    tmpVec.copy(DISPENSER_EMIT_WORLD)
    camera.worldToLocal(tmpVec)
    group.position.copy(tmpVec).lerp(loadedVec, eased)
    // Rotation interpolates each axis toward CART_LOADED_ROT. The Z
    // component carries the 90° horizontal flip — at u=0 the cart
    // pops out of the dispenser upright, by u=1 it has rotated into
    // the cross-loaded barrel pose.
    group.rotation.set(
      eased * CART_LOADED_ROT[0],
      (1 - eased) * Math.PI * 0.45 + eased * CART_LOADED_ROT[1],
      eased * CART_LOADED_ROT[2],
    )
    if (u >= 1) {
      animRef.current = null
      group.position.copy(loadedVec)
      group.rotation.set(...CART_LOADED_ROT)
    }
  })

  if (!inv.cart) return null

  // Cart visual swaps blank → textured the moment the cart's slug
  // binds (first scan in Carcosa). Same chamfered silhouette either
  // way; the textured branch picks up the doc's seed-derived accent
  // palette + face art + spine title so the inserted cart reads as
  // canonized once it carries data.
  return (
    <group ref={groupRef} position={CART_LOADED_POS} rotation={CART_LOADED_ROT}>
      <CartArt slug={inv.cart.slug} />
    </group>
  )
}
