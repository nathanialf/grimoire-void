import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BackSide,
  BufferAttribute,
  CanvasTexture,
  Color,
  ExtrudeGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  NearestFilter,
  Object3D,
  Path,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  type Group,
} from 'three'
import { useFrame } from '@react-three/fiber'
import {
  ROOM,
  PEDESTAL_SIZE,
  pedestalPositions,
  EXIT_Z_POS,
  ARTIFACT_NAMES,
} from './sceneConstants'
import {
  DOOR_W,
  DOOR_H,
  DOOR_CY,
  FrameTicker,
  makeDebugTickerCanvas,
} from './frameTicker'

const BAND_HEIGHT = 0.11

// Deterministic pseudo-random generator seeded by pedestal index so each
// pedestal gets a unique but reproducible artifact pattern.
function seeded(seed: number) {
  let s = (seed * 2654435761) >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

// Linear-interpolate two `#rrggbb` hex strings; t∈[0,1].
function lerpHexColor(a: string, b: string, t: number): string {
  const ai = parseInt(a.slice(1), 16)
  const bi = parseInt(b.slice(1), 16)
  const ar = (ai >> 16) & 0xff, ag = (ai >> 8) & 0xff, ab = ai & 0xff
  const br = (bi >> 16) & 0xff, bg = (bi >> 8) & 0xff, bb = bi & 0xff
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return '#' + ((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')
}

// QR-code-flavored palettes — dark ink on a white base, plus one vivid accent.
// Base is white so the ombre fades up into a "transparent" backdrop that
// matches the wall. Accents are saturated, mid-luminance hues — never
// pastel/near-white — so they hold their color against bloom and stand out
// against the white pedestal body.
const ARTIFACT_PALETTES: { base: string; ink: string; accent: string }[] = [
  { base: '#ffffff', ink: '#0a0a0a', accent: '#ff4030' }, // red    + bold red-orange
  { base: '#ffffff', ink: '#120c1e', accent: '#a830ff' }, // purple + vivid magenta-purple
  { base: '#ffffff', ink: '#082014', accent: '#00c060' }, // green  + emerald
  { base: '#ffffff', ink: '#1a0812', accent: '#ff2090' }, // pink   + saturated magenta
  { base: '#ffffff', ink: '#081424', accent: '#0090ff' }, // blue   + electric blue
  { base: '#ffffff', ink: '#1f1409', accent: '#ff9000' }, // orange + bold amber
]

type ArtifactCell = { x: number; y: number; color: string }
type ArtifactPattern = {
  cellsX: number
  cellsY: number
  pixel: number
  width: number
  height: number
  base: string
  ink: string
  accent: string
  halfBlock: boolean
  cells: ArtifactCell[]
}

export type ArtifactOpts = {
  ombre: boolean
  aspect?: number
  cellsX?: number
  pixel?: number
  // Vertical-half block: left half of the texture is filled with horizontal
  // bands of the three palette colors (a swatch of the texture's palette),
  // and the procedural pattern only renders on the right half.
  halfBlock?: boolean
  // Override the seed-derived palette (e.g. for the carcosa portal which
  // uses black base + white/gray pops instead of the museum palettes).
  palette?: { base: string; ink: string; accent: string }
  // For ombre:false mode, total fraction of cells that get ink-or-accent
  // (default 0.62). For ombre:true this is unused.
  density?: number
  // Fraction of filled cells that are ink (rest are accent). Default 0.8.
  inkFraction?: number
  // Edge bias: cells within `thickness` cells of the perimeter that get
  // filled by the procedural pattern always use the palette's ink color
  // (or `color` override, e.g. red on red-framed doors) instead of rolling
  // for accent — so the noise reads as a darker frame around a colorful
  // interior, without drawing a literal solid border.
  edgeInk?: { thickness: number; color?: string }
}

function computeArtifactPattern(seed: number, opts: ArtifactOpts): ArtifactPattern {
  const cellsX = opts.cellsX ?? 64
  const aspect = opts.aspect ?? 1
  const cellsY = Math.max(8, Math.round(cellsX * aspect))
  const pixel = opts.pixel ?? 12
  const rand = seeded(seed + 1)
  const { base, ink, accent } = opts.palette ?? ARTIFACT_PALETTES[seed % ARTIFACT_PALETTES.length]
  const halfCellsX = Math.floor(cellsX / 2)
  // Default ink:accent split is 40:60 of the filled cells — about half of
  // what would have been dark ink instead lands on the brighter accent color.
  const inkFrac = opts.inkFraction ?? 0.4
  const flatDensity = opts.density ?? 0.62
  const edgeInkT = opts.edgeInk?.thickness ?? 0
  const edgeInkColor = opts.edgeInk?.color ?? ink
  // Pre-compute one color per edge ring, lerping from the edge ink color at
  // the very perimeter (ring 0) to the palette's interior ink at the inner
  // boundary (ring edgeInkT-1). Gives a smooth color falloff into the
  // interior instead of a hard ring of red.
  const edgeRingColors: string[] = []
  if (edgeInkT > 0) {
    for (let i = 0; i < edgeInkT; i++) {
      const t = edgeInkT > 1 ? i / (edgeInkT - 1) : 0
      edgeRingColors.push(lerpHexColor(edgeInkColor, ink, t))
    }
  }
  const cells: ArtifactCell[] = []

  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      if (opts.halfBlock && x < halfCellsX) continue
      const d = opts.ombre ? y / (cellsY - 1) : 1
      const threshold = opts.ombre ? 0.05 + d * 0.85 : flatDensity
      const r = rand()
      if (r >= threshold) continue // cell stays unfilled (base)
      const normRoll = r / threshold // [0, 1)
      const distToEdge = Math.min(x, cellsX - 1 - x, y, cellsY - 1 - y)
      if (edgeInkT > 0 && distToEdge < edgeInkT) {
        // Edge zone: probability of "ink-like" (vs accent pop) lerps from 1
        // at the perimeter down to the interior inkFraction at the boundary.
        const t = edgeInkT > 1 ? distToEdge / (edgeInkT - 1) : 0
        const inkProb = 1 - t * (1 - inkFrac)
        if (normRoll < inkProb) cells.push({ x, y, color: edgeRingColors[distToEdge] })
        else cells.push({ x, y, color: accent })
      } else {
        if (normRoll < inkFrac) cells.push({ x, y, color: ink })
        else cells.push({ x, y, color: accent })
      }
    }
  }

  return {
    cellsX,
    cellsY,
    pixel,
    width: cellsX * pixel,
    height: cellsY * pixel,
    base,
    ink,
    accent,
    halfBlock: !!opts.halfBlock,
    cells,
  }
}

function paintArtifactBackground(ctx: CanvasRenderingContext2D, p: ArtifactPattern): void {
  ctx.fillStyle = p.base
  ctx.fillRect(0, 0, p.width, p.height)
  if (p.halfBlock) {
    const halfCellsX = Math.floor(p.cellsX / 2)
    const bandColors = [p.base, p.accent, p.ink]
    const blockW = halfCellsX * p.pixel
    for (let b = 0; b < bandColors.length; b++) {
      ctx.fillStyle = bandColors[b]
      const y0 = Math.round((b / bandColors.length) * p.height)
      const y1 = Math.round(((b + 1) / bandColors.length) * p.height)
      ctx.fillRect(0, y0, blockW, y1 - y0)
    }
  }
}

// One-shot static artifact texture — full pattern painted up front, no
// reveal animation. Used by ChipPanel so the cartridge label doesn't
// re-animate every time the player looks at it.
function makeStaticArtifactTexture(seed: number, opts: ArtifactOpts): CanvasTexture {
  const pattern = computeArtifactPattern(seed, opts)
  const { ctx, tex } = newArtifactCanvasTexture(pattern)
  paintArtifactBackground(ctx, pattern)
  for (const c of pattern.cells) {
    ctx.fillStyle = c.color
    ctx.fillRect(c.x * pattern.pixel, c.y * pattern.pixel, pattern.pixel, pattern.pixel)
  }
  return tex
}

function newArtifactCanvasTexture(p: ArtifactPattern): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; tex: CanvasTexture } {
  const canvas = document.createElement('canvas')
  canvas.width = p.width
  canvas.height = p.height
  const ctx = canvas.getContext('2d')!
  const tex = new CanvasTexture(canvas)
  tex.magFilter = NearestFilter
  tex.minFilter = NearestFilter
  tex.generateMipmaps = false
  tex.colorSpace = SRGBColorSpace
  return { canvas, ctx, tex }
}

// Animated reveal: morphs the canvas pixel-by-pixel from its current state
// into the new pattern over `durationMs` with an ease-out curve. The first
// effect run looks like a "decode-in" from the base color (because the
// canvas was pre-painted with the backdrop); subsequent seed changes morph
// directly between textures cell-by-cell instead of resetting to base first.
export function useRevealedArtifactTexture(
  seed: number,
  opts: ArtifactOpts,
  durationMs = 1200,
): CanvasTexture {
  // Stable surface across seed changes. Pre-paint the backdrop so the very
  // first reveal animation starts from base/half-block instead of a
  // transparent/black canvas.
  const surface = useMemo(() => {
    const pattern = computeArtifactPattern(seed, opts)
    const s = newArtifactCanvasTexture(pattern)
    paintArtifactBackground(s.ctx, pattern)
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const pattern = computeArtifactPattern(seed, opts)
    const { ctx, tex } = surface

    // Build the per-cell target color for every position in the grid (not
    // just the ink/accent cells), so cells that need to change BACK to base
    // also animate — that's how transitions between textures actually morph
    // pixel-by-pixel instead of clearing to the backdrop first.
    const halfCellsX = Math.floor(pattern.cellsX / 2)
    const targetByIdx = new Map<number, string>()
    for (const c of pattern.cells) {
      targetByIdx.set(c.y * pattern.cellsX + c.x, c.color)
    }
    const all: ArtifactCell[] = []
    for (let y = 0; y < pattern.cellsY; y++) {
      for (let x = 0; x < pattern.cellsX; x++) {
        let color: string
        if (pattern.halfBlock && x < halfCellsX) {
          // Match paintArtifactBackground band split: choose the band by the
          // cell's pixel-midpoint y so the cell-by-cell repaint lines up
          // with the backdrop's fillRect rounding.
          const cellMidY = y * pattern.pixel + pattern.pixel / 2
          const bandIdx = Math.min(2, Math.floor((cellMidY / pattern.height) * 3))
          color = [pattern.base, pattern.accent, pattern.ink][bandIdx]
        } else {
          color = targetByIdx.get(y * pattern.cellsX + x) ?? pattern.base
        }
        all.push({ x, y, color })
      }
    }

    // Shuffle order with a different seed so the morph progresses in a
    // different sequence each transition.
    const orderRand = seeded(seed + 9931)
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(orderRand() * (i + 1))
      ;[all[i], all[j]] = [all[j], all[i]]
    }

    const start = performance.now()
    let drawnIdx = 0
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      const target = Math.floor(eased * all.length)
      for (let i = drawnIdx; i < target; i++) {
        const c = all[i]
        ctx.fillStyle = c.color
        ctx.fillRect(c.x * pattern.pixel, c.y * pattern.pixel, pattern.pixel, pattern.pixel)
      }
      if (target > drawnIdx) {
        drawnIdx = target
        tex.needsUpdate = true
      }
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, durationMs])

  return surface.tex
}

function makeSealTickerCanvas(): { canvas: HTMLCanvasElement } {
  const msg = 'SEAL █ '
  const font = '900 44px "JetBrains Mono", ui-monospace, monospace'
  const h = 64
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = font
  const msgWidth = Math.ceil(measure.measureText(msg).width)
  const copies = 8
  const w = msgWidth * copies

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.font = font
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < copies; i++) {
    ctx.fillText(msg, i * msgWidth, h / 2)
  }
  return { canvas }
}

function makePedestalTickerCanvas(): { canvas: HTMLCanvasElement; msgWidth: number } {
  const msg = 'PLACEHOLDER TEXT █ DO NOT DEPLOY █ '
  const font = '900 44px "JetBrains Mono", ui-monospace, monospace'
  const COPIES = 4

  const measureCanvas = document.createElement('canvas')
  const measureCtx = measureCanvas.getContext('2d')!
  measureCtx.font = font
  const msgWidth = Math.ceil(measureCtx.measureText(msg).width)
  const totalWidth = msgWidth * COPIES
  // Canvas aspect so that one message (a quarter of the canvas) fits one
  // pedestal face at its natural proportions.
  const h = Math.round(msgWidth * BAND_HEIGHT / PEDESTAL_SIZE)

  const canvas = document.createElement('canvas')
  canvas.width = totalWidth
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(0, 0, totalWidth, h)
  ctx.font = font
  ctx.fillStyle = '#000'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < COPIES; i++) {
    ctx.fillText(msg, i * msgWidth, h / 2)
  }
  return { canvas, msgWidth }
}

// Door textures only re-cycle their pattern when the player is within this
// world-units radius of the door — roughly 2× the trigger-zone reach so the
// re-scan animation kicks in well before the player can interact.
export const DOOR_ANIM_RADIUS = 3

function ExitDoor() {
  // Cycle through a handful of seeds; each swap re-reveals the new pattern
  // pixel-by-pixel via useRevealedArtifactTexture so the door visibly
  // "re-scans" instead of hard-cutting between baked images. Cycling only
  // advances while the player is close — saves work and stops the doors
  // animating constantly across the room.
  const [idx, setIdx] = useState(0)
  const cycleAccum = useRef(0)
  useFrame(({ camera }, delta) => {
    const dx = camera.position.x - 0
    const dy = camera.position.y - DOOR_CY
    const dz = camera.position.z - (EXIT_Z_POS - 0.001)
    if (Math.hypot(dx, dy, dz) >= DOOR_ANIM_RADIUS) return
    cycleAccum.current += delta * 1000
    if (cycleAccum.current >= 3000) {
      cycleAccum.current = 0
      setIdx((n) => (n + 1) % 5)
    }
  })
  const tex = useRevealedArtifactTexture(
    99 + idx * 17,
    {
      ombre: false,
      aspect: DOOR_H / DOOR_W,
      // Perimeter cells use ink color so the noise reads as a darker frame
      // matching the SealFrame's strips, with accent pops in the interior.
      edgeInk: { thickness: 12 },
    },
    1100,
  )

  // Position the door just in front of the wall but BEHIND the seal strips,
  // so the strips (at zFront = EXIT_Z_POS - 0.005) render on top and the
  // bottom strip isn't occluded by the door.
  return (
    <mesh position={[0, DOOR_CY, EXIT_Z_POS - 0.001]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[DOOR_W, DOOR_H]} />
      <meshStandardMaterial map={tex} roughness={0.9} metalness={0} />
    </mesh>
  )
}

function DebugDoor() {
  // Pulsing-noise carcosa door. Sits flush in the -X wall opening; the door
  // panel is positioned slightly toward the museum interior to fill the cut
  // doorway shape from the player-visible side. Each cycle re-reveals the
  // new pattern via useRevealedArtifactTexture, but cycling only advances
  // while the player is close to the door.
  const [idx, setIdx] = useState(0)
  const cycleAccum = useRef(0)
  useFrame(({ camera }, delta) => {
    const dx = camera.position.x - (-ROOM.w / 2 + 0.001)
    const dy = camera.position.y - DOOR_CY
    const dz = camera.position.z - 0
    if (Math.hypot(dx, dy, dz) >= DOOR_ANIM_RADIUS) return
    cycleAccum.current += delta * 1000
    if (cycleAccum.current >= 2200) {
      cycleAccum.current = 0
      setIdx((n) => (n + 1) % 5)
    }
  })
  const tex = useRevealedArtifactTexture(
    311 + idx * 13,
    {
      ombre: false,
      aspect: DOOR_H / DOOR_W,
      // Red perimeter ink — matches the carcosa door's red FrameTicker.
      edgeInk: { thickness: 12, color: '#ff0000' },
    },
    900,
  )

  return (
    <mesh
      position={[-ROOM.w / 2 + 0.001, DOOR_CY, 0]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <planeGeometry args={[DOOR_W, DOOR_H]} />
      <meshStandardMaterial map={tex} roughness={0.9} metalness={0} />
    </mesh>
  )
}

function SealFrame() {
  const { canvas } = useMemo(() => makeSealTickerCanvas(), [])
  // Museum exit door on +Z wall, facing -Z (rotationY = π). Strips sit at
  // EXIT_Z_POS - 0.005 (slightly into the room).
  return (
    <FrameTicker
      canvas={canvas}
      centerX={0}
      centerY={DOOR_CY}
      centerZ={EXIT_Z_POS}
      rotationY={Math.PI}
      outwardOffset={-0.005}
      wallAxis="x"
      cornerColor="#ffffff"
    />
  )
}

function DebugFrame() {
  const { canvas } = useMemo(() => makeDebugTickerCanvas(), [])
  // Carcosa door on the museum's -X wall, facing +X (rotationY = π/2). Strips
  // sit at -ROOM.w/2 + 0.005 (slightly into the museum interior).
  return (
    <FrameTicker
      canvas={canvas}
      centerX={-ROOM.w / 2}
      centerY={DOOR_CY}
      centerZ={0}
      rotationY={Math.PI / 2}
      outwardOffset={0.005}
      wallAxis="z"
      cornerColor="#ff0000"
    />
  )
}

// Voxel-relief pedestal — each ink/accent cell becomes a small instanced
// cube protruding from one of four side faces. On scene-load the voxels
// extrude from scale=0 with staggered timing, and ink voxels animate THROUGH
// the bright accent color first before lerping down to dark ink. Per-instance
// emissive is achieved by patching the meshStandardMaterial to multiply
// `emissive` by the instance's vColor.
type Voxel = {
  posBase: [number, number, number]
  normal: [number, number, number]
  spawnDelay: number
  instanceIdx: number
  finalized: boolean
}

const REVEAL_TOTAL_MS = 1800
const VOXEL_DURATION_MS = 500
const COLOR_PHASE_START = 0.5

// Small static "cartridge/chip" panel that mirrors the pedestal's pixel
// pattern as a flat texture on its front and back. N64-style — narrower
// than tall, thin slab, with rounded shoulders / arched top. Casing is
// tinted with the palette's accent color so each pedestal's cartridge
// matches its pixel pattern.
function ChipPanel({ x, z, seed }: { x: number; z: number; seed: number }) {
  const W = 0.22, H = 0.32, D = 0.025
  const palette = ARTIFACT_PALETTES[seed % ARTIFACT_PALETTES.length]
  const casingColor = palette.accent

  // Build the cartridge outline — N64-style: straight bottom + sides, then
  // a diagonal CHAMFER at each top corner (no curves) cutting across to a
  // flat top edge. Used both for the extruded body and for the textured
  // front/back face planes (so the texture is masked to the silhouette).
  const { bodyGeo, faceGeo, backFaceGeo } = useMemo(() => {
    const cornerW = W * 0.24
    const cornerH = H * 0.10
    const shape = new Shape()
    shape.moveTo(-W / 2, 0)
    shape.lineTo( W / 2, 0)
    shape.lineTo( W / 2, H - cornerH)
    shape.lineTo( W / 2 - cornerW, H)
    shape.lineTo(-W / 2 + cornerW, H)
    shape.lineTo(-W / 2, H - cornerH)
    shape.lineTo(-W / 2, 0)

    const body = new ExtrudeGeometry(shape, { depth: D, bevelEnabled: false })
    body.translate(0, -H / 2, -D / 2)

    const buildFace = (flipU: boolean): ShapeGeometry => {
      const g = new ShapeGeometry(shape)
      const pos = g.attributes.position
      const uvs = new Float32Array(pos.count * 2)
      for (let i = 0; i < pos.count; i++) {
        const u = (pos.getX(i) + W / 2) / W
        uvs[i * 2 + 0] = flipU ? 1 - u : u
        uvs[i * 2 + 1] = pos.getY(i) / H
      }
      g.setAttribute('uv', new BufferAttribute(uvs, 2))
      g.translate(0, -H / 2, 0)
      return g
    }

    return { bodyGeo: body, faceGeo: buildFace(false), backFaceGeo: buildFace(true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Both faces use the same custom palette: accent base (matches the
  // cartridge casing — no white background showing through), palette ink
  // for the dark pattern (matches the pedestal's voxel ink), and white
  // pop highlights. Front and back use different seeds so the cartridge
  // looks different from each side without mismatching colors.
  // Ink stays pure black so it reads as dark; pop cells are a LIGHT shade
  // of the accent (instead of pure white) so the dense bottom of the ombre
  // — where black ink + white pops were averaging into gray — now mixes
  // into shades of the accent color family.
  const cartPop = lerpHexColor(palette.accent, '#ffffff', 0.5)
  const cartPalette = { base: palette.accent, ink: '#000000', accent: cartPop }
  const frontTex = useMemo(
    () => makeStaticArtifactTexture(seed, {
      ombre: true, cellsX: 44, pixel: 18, aspect: H / W, palette: cartPalette,
    }),
    [seed, palette.accent],
  )
  const backTex = useMemo(
    () => makeStaticArtifactTexture(seed + 7777, {
      ombre: true, cellsX: 44, pixel: 18, aspect: H / W, palette: cartPalette,
    }),
    [seed, palette.accent],
  )
  const len = Math.hypot(x, z) || 1
  const cx = -x / len
  const cz = -z / len
  const facingY = Math.atan2(cx, cz)
  const edgeOffset = PEDESTAL_SIZE / 2 - 0.05
  const yAbove = PEDESTAL_SIZE + 0.28
  const tiltX = -Math.PI / 8

  return (
    <group position={[cx * edgeOffset, yAbove, cz * edgeOffset]} rotation={[0, facingY, 0]}>
      <group rotation={[tiltX, 0, 0]}>
        {/* Cartridge body — tinted accent-color casing visible on the side
            walls and behind the textured face planes. metalness=0 so the
            color renders as a saturated diffuse instead of a dark metallic
            (the previous 0.4 was reading as a gray sheen with no envMap). */}
        <mesh geometry={bodyGeo}>
          <meshStandardMaterial color={casingColor} roughness={0.55} metalness={0} />
        </mesh>
        {/* Front label — masked to the arched outline, frontTex on it. */}
        <mesh geometry={faceGeo} position={[0, 0, D / 2 + 0.0005]}>
          <meshStandardMaterial map={frontTex} roughness={0.85} metalness={0} />
        </mesh>
        {/* Back label — uses backFaceGeo (UV.x flipped so the texture reads
            correctly when viewed from -Z) and BackSide so the geometry
            renders on its back side without rotating the mesh. */}
        <mesh geometry={backFaceGeo} position={[0, 0, -D / 2 - 0.0005]}>
          <meshStandardMaterial map={backTex} side={BackSide} roughness={0.85} metalness={0} />
        </mesh>
      </group>
    </group>
  )
}

function VoxelPedestal({ x, z, seed, name }: { x: number; z: number; seed: number; name: string }) {
  const opts: ArtifactOpts = { ombre: true, cellsX: 44, pixel: 18 }
  const pattern = useMemo(() => computeArtifactPattern(seed, opts), [seed])
  const cellSize = PEDESTAL_SIZE / pattern.cellsX

  const data = useMemo(() => {
    const halfPS = PEDESTAL_SIZE / 2
    const faces = [
      { normal: [ 1, 0, 0], uDir: [0, 0, -1], vDir: [0, -1, 0], origin: [ halfPS, PEDESTAL_SIZE,  halfPS] },
      { normal: [-1, 0, 0], uDir: [0, 0,  1], vDir: [0, -1, 0], origin: [-halfPS, PEDESTAL_SIZE, -halfPS] },
      { normal: [0, 0,  1], uDir: [ 1, 0, 0], vDir: [0, -1, 0], origin: [-halfPS, PEDESTAL_SIZE,  halfPS] },
      { normal: [0, 0, -1], uDir: [-1, 0, 0], vDir: [0, -1, 0], origin: [ halfPS, PEDESTAL_SIZE, -halfPS] },
    ] as const
    const inkV: Voxel[] = []
    const accentV: Voxel[] = []
    const rand = seeded(seed + 31415)
    const maxSpawn = REVEAL_TOTAL_MS - VOXEL_DURATION_MS
    for (const face of faces) {
      for (const cell of pattern.cells) {
        const isInk = cell.color === pattern.ink
        const uPos = (cell.x + 0.5) * cellSize
        const vPos = (cell.y + 0.5) * cellSize
        const posBase: [number, number, number] = [
          face.origin[0] + uPos * face.uDir[0] + vPos * face.vDir[0],
          face.origin[1] + uPos * face.uDir[1] + vPos * face.vDir[1],
          face.origin[2] + uPos * face.uDir[2] + vPos * face.vDir[2],
        ]
        const target = isInk ? inkV : accentV
        target.push({
          posBase,
          normal: [face.normal[0], face.normal[1], face.normal[2]],
          spawnDelay: rand() * maxSpawn,
          instanceIdx: target.length,
          finalized: false,
        })
      }
    }
    return { inkVoxels: inkV, accentVoxels: accentV }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern, cellSize, seed])

  // Ink material: no emissive at all so the dark final state actually reads
  // dark. Per-instance color drives diffuse only — phase 1 voxels appear as
  // matte accent cubes (no bloomy glow), phase 2 lerps the diffuse to the
  // palette's ink color.
  const inkMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.85,
        metalness: 0,
      }),
    [],
  )
  const accentMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: pattern.accent,
        emissive: pattern.accent,
        emissiveIntensity: 2.4,
        roughness: 0.85,
        metalness: 0,
      }),
    [pattern.accent],
  )

  const inkMeshRef = useRef<InstancedMesh>(null)
  const accentMeshRef = useRef<InstancedMesh>(null)
  const startTimeRef = useRef<number | null>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const tmpColor = useMemo(() => new Color(), [])
  const inkColor = useMemo(() => new Color(pattern.ink), [pattern.ink])
  const accentColor = useMemo(() => new Color(pattern.accent), [pattern.accent])

  // Initialize all voxels at scale=0 (invisible) and seed ink instance
  // colors at accent (the color they animate from).
  useEffect(() => {
    const inkMesh = inkMeshRef.current
    const accentMesh = accentMeshRef.current
    if (!inkMesh || !accentMesh) return
    const zero = new Matrix4().makeScale(0, 0, 0)
    for (let i = 0; i < data.inkVoxels.length; i++) {
      inkMesh.setMatrixAt(i, zero)
      inkMesh.setColorAt(i, accentColor)
    }
    inkMesh.count = data.inkVoxels.length
    inkMesh.instanceMatrix.needsUpdate = true
    if (inkMesh.instanceColor) inkMesh.instanceColor.needsUpdate = true
    for (let i = 0; i < data.accentVoxels.length; i++) {
      accentMesh.setMatrixAt(i, zero)
    }
    accentMesh.count = data.accentVoxels.length
    accentMesh.instanceMatrix.needsUpdate = true
    for (const v of data.inkVoxels) v.finalized = false
    for (const v of data.accentVoxels) v.finalized = false
    startTimeRef.current = performance.now()
  }, [data, accentColor])

  useFrame(() => {
    const inkMesh = inkMeshRef.current
    const accentMesh = accentMeshRef.current
    if (!inkMesh || !accentMesh || startTimeRef.current === null) return
    const elapsed = performance.now() - startTimeRef.current
    if (elapsed > REVEAL_TOTAL_MS + 50) return // animation finished

    let inkChanged = false
    let accentChanged = false

    for (const v of data.inkVoxels) {
      if (v.finalized) continue
      const localT = elapsed - v.spawnDelay
      if (localT <= 0) continue
      const progress = Math.min(1, localT / VOXEL_DURATION_MS)
      // Phase 1: extrude (scale grows, with ease-out).
      const scaleT = Math.min(1, progress / COLOR_PHASE_START)
      const easedScale = 1 - (1 - scaleT) ** 3
      const curDepth = easedScale * cellSize
      const off = curDepth / 2
      dummy.position.set(
        v.posBase[0] + off * v.normal[0],
        v.posBase[1] + off * v.normal[1],
        v.posBase[2] + off * v.normal[2],
      )
      dummy.scale.set(
        v.normal[0] !== 0 ? curDepth : cellSize,
        v.normal[1] !== 0 ? curDepth : cellSize,
        v.normal[2] !== 0 ? curDepth : cellSize,
      )
      dummy.updateMatrix()
      inkMesh.setMatrixAt(v.instanceIdx, dummy.matrix)
      // Phase 2: instance color lerps accent → ink (and via the shader patch,
      // emissive lerps with it so the cube fades from glowing to matte).
      const colorT = Math.max(0, (progress - COLOR_PHASE_START) / (1 - COLOR_PHASE_START))
      tmpColor.copy(accentColor).lerp(inkColor, colorT)
      inkMesh.setColorAt(v.instanceIdx, tmpColor)
      inkChanged = true
      if (progress >= 1) v.finalized = true
    }

    for (const v of data.accentVoxels) {
      if (v.finalized) continue
      const localT = elapsed - v.spawnDelay
      if (localT <= 0) continue
      const progress = Math.min(1, localT / VOXEL_DURATION_MS)
      const eased = 1 - (1 - progress) ** 3
      const curDepth = eased * (cellSize / 2)
      const off = curDepth / 2
      dummy.position.set(
        v.posBase[0] + off * v.normal[0],
        v.posBase[1] + off * v.normal[1],
        v.posBase[2] + off * v.normal[2],
      )
      dummy.scale.set(
        v.normal[0] !== 0 ? curDepth : cellSize,
        v.normal[1] !== 0 ? curDepth : cellSize,
        v.normal[2] !== 0 ? curDepth : cellSize,
      )
      dummy.updateMatrix()
      accentMesh.setMatrixAt(v.instanceIdx, dummy.matrix)
      accentChanged = true
      if (progress >= 1) v.finalized = true
    }

    if (inkChanged) {
      inkMesh.instanceMatrix.needsUpdate = true
      if (inkMesh.instanceColor) inkMesh.instanceColor.needsUpdate = true
    }
    if (accentChanged) accentMesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, PEDESTAL_SIZE / 2, 0]}>
        <boxGeometry args={[PEDESTAL_SIZE, PEDESTAL_SIZE, PEDESTAL_SIZE]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.7} roughness={0.85} metalness={0} />
      </mesh>
      <instancedMesh ref={inkMeshRef} args={[undefined, undefined, data.inkVoxels.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={inkMaterial} attach="material" />
      </instancedMesh>
      <instancedMesh ref={accentMeshRef} args={[undefined, undefined, data.accentVoxels.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={accentMaterial} attach="material" />
      </instancedMesh>
      <PedestalTicker />
      <FloatingLabel name={name} seed={seed} />
      <ChipPanel x={x} z={z} seed={seed} />
    </group>
  )
}


const LABEL_SIZE = 0.32
const LABEL_BAND_H = LABEL_SIZE / 3

function makeLabelCanvas(name: string): HTMLCanvasElement {
  const font = '900 54px "JetBrains Mono", ui-monospace, monospace'
  const h = 96
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = font
  const textW = Math.ceil(measure.measureText(name).width)
  const padding = 48
  const w = textW + padding * 2
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#bfff00'
  ctx.fillRect(0, 0, w, h)
  ctx.font = font
  ctx.fillStyle = '#000'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(name, w / 2, h / 2)
  // Thicken with a stroke pass so letters hold up against bloom + CA.
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 5
  ctx.strokeText(name, w / 2, h / 2)
  return canvas
}

function FloatingLabel({ name, seed }: { name: string; seed: number }) {
  const groupRef = useRef<Group>(null)
  const canvas = useMemo(() => makeLabelCanvas(name), [name])
  const tex = useMemo(() => {
    const t = new CanvasTexture(canvas)
    t.wrapS = RepeatWrapping
    t.wrapT = RepeatWrapping
    t.anisotropy = 4
    t.needsUpdate = true
    return t
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas])

  useFrame(({ clock }, dt) => {
    if (groupRef.current) {
      const t = clock.elapsedTime + seed
      groupRef.current.position.y = PEDESTAL_SIZE + 0.55 + Math.sin(t * 1.4) * 0.04
      groupRef.current.rotation.y = t * 0.4
    }
    tex.offset.x = (tex.offset.x + dt * 0.1) % 1
  })

  const half = LABEL_SIZE / 2
  // Top-aligned: strip's top edge flush with the cube's top, matching the
  // pedestal ticker anchoring.
  const bandY = LABEL_SIZE / 2 - LABEL_BAND_H / 2
  const faces: { pos: [number, number, number]; rotY: number }[] = [
    { pos: [0, bandY, half], rotY: 0 },
    { pos: [half, bandY, 0], rotY: Math.PI / 2 },
    { pos: [0, bandY, -half], rotY: Math.PI },
    { pos: [-half, bandY, 0], rotY: -Math.PI / 2 },
  ]

  return (
    <group ref={groupRef} position={[0, PEDESTAL_SIZE + 0.55, 0]}>
      {/* Dark cube body — only the middle ticker strip is accent green. */}
      <mesh>
        <boxGeometry args={[LABEL_SIZE, LABEL_SIZE, LABEL_SIZE]} />
        <meshBasicMaterial color="#0a0a0a" toneMapped={false} />
      </mesh>
      {faces.map((f, i) => (
        <mesh key={i} position={f.pos} rotation={[0, f.rotY, 0]}>
          <planeGeometry args={[LABEL_SIZE, LABEL_BAND_H]} />
          <meshBasicMaterial
            map={tex}
            toneMapped={false}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      ))}
    </group>
  )
}

function PedestalTicker() {
  const { canvas } = useMemo(() => makePedestalTickerCanvas(), [])

  // One texture per face. Each samples exactly 25% of the canvas at a distinct
  // base offset, so the text reads continuously around the four walls when
  // offset.x is advanced in lockstep (a glyph exiting face N's right edge
  // re-enters face N+1's left edge).
  const textures = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const t = new CanvasTexture(canvas)
      t.wrapS = RepeatWrapping
      t.wrapT = RepeatWrapping
      t.repeat.x = 0.25
      t.offset.x = i * 0.25
      t.anisotropy = 4
      t.needsUpdate = true
      return t
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas])

  useFrame((_, dt) => {
    const d = dt * 0.03
    for (const t of textures) t.offset.x = (t.offset.x + d) % 1
  })

  // Band centered vertically so its TOP sits flush with the pedestal's top
  // corner: band_top = PEDESTAL_SIZE → band_center_y = PEDESTAL_SIZE - BAND_HEIGHT/2.
  const y = PEDESTAL_SIZE - BAND_HEIGHT / 2
  const half = PEDESTAL_SIZE / 2

  // Order (CW looking down): +Z, +X, -Z, -X — perimeter from front, clockwise.
  // Plane default normal is +Z; rotate around Y to face outward.
  const faces: { pos: [number, number, number]; rotY: number }[] = [
    { pos: [0, y, half], rotY: 0 },
    { pos: [half, y, 0], rotY: Math.PI / 2 },
    { pos: [0, y, -half], rotY: Math.PI },
    { pos: [-half, y, 0], rotY: -Math.PI / 2 },
  ]

  return (
    <>
      {faces.map((f, i) => (
        <mesh key={i} position={f.pos} rotation={[0, f.rotY, 0]}>
          <planeGeometry args={[PEDESTAL_SIZE, BAND_HEIGHT]} />
          <meshBasicMaterial
            map={textures[i]}
            toneMapped={false}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      ))}
    </>
  )
}

function makeRoomLightmap(): CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.6)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(1, '#7a7a7a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = RepeatWrapping
  return tex
}

function makeFloorLightmap(): CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.6)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(1, '#7a7a7a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = RepeatWrapping
  return tex
}

const WALL_COLOR = '#ffffff'
const FLOOR_COLOR = '#f7f7f7'

// Single-shape geometry for a wall with a rectangular doorway cut out of the
// bottom-center. Shape coords span x ∈ [-wallW/2, wallW/2], y ∈ [0, wallH].
// UVs are remapped to [0,1] across the full wall so a single texture (and
// single lightmap) stretches seamlessly over the whole surface rather than
// repeating per-strip.
function makeWallWithDoorwayGeometry(
  wallW: number,
  wallH: number,
  openW: number,
  openH: number,
): ShapeGeometry {
  const shape = new Shape()
  shape.moveTo(-wallW / 2, 0)
  shape.lineTo( wallW / 2, 0)
  shape.lineTo( wallW / 2, wallH)
  shape.lineTo(-wallW / 2, wallH)
  shape.closePath()

  const hole = new Path()
  hole.moveTo(-openW / 2, 0)
  hole.lineTo( openW / 2, 0)
  hole.lineTo( openW / 2, openH)
  hole.lineTo(-openW / 2, openH)
  hole.closePath()
  shape.holes.push(hole)

  const geo = new ShapeGeometry(shape)
  const pos = geo.attributes.position
  const uvs = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2 + 0] = (pos.getX(i) + wallW / 2) / wallW
    uvs[i * 2 + 1] = pos.getY(i) / wallH
  }
  const uvAttr = new BufferAttribute(uvs, 2)
  geo.setAttribute('uv', uvAttr)
  geo.setAttribute('uv1', uvAttr)
  return geo
}

interface PlaneProps {
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number]
  color?: string
  lightMap?: CanvasTexture
  map?: CanvasTexture
}
function FlatPlane({ position, rotation, size, color = WALL_COLOR, lightMap, map }: PlaneProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.95}
        metalness={0}
        lightMap={lightMap}
        lightMapIntensity={1.0}
        map={map}
      />
    </mesh>
  )
}

function MuseumRoom({ lightMap, floorLightMap }: { lightMap: CanvasTexture; floorLightMap: CanvasTexture }) {
  // -X wall has the carcosa door cut out of it — opening sized to the door
  // panel itself (no corridor or antechamber beyond).
  const openW = DOOR_W
  const openH = DOOR_H
  const halfW = ROOM.w / 2  // 6
  const halfD = ROOM.d / 2  // 6
  const halfH = ROOM.h / 2
  const carcosaWallGeo = useMemo(
    () => makeWallWithDoorwayGeometry(ROOM.d, ROOM.h, openW, openH),
    [openW, openH],
  )

  return (
    <>
      {/* Floor */}
      <FlatPlane
        position={[0, 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={[ROOM.w, ROOM.d]}
        color={FLOOR_COLOR}
        lightMap={floorLightMap}
      />
      {/* Ceiling */}
      <FlatPlane
        position={[0, ROOM.h, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        size={[ROOM.w, ROOM.d]}
        lightMap={lightMap}
      />
      {/* +Z wall (back wall, with sealed exit door) — facing -Z */}
      <FlatPlane
        position={[0, halfH, halfD]}
        rotation={[0, Math.PI, 0]}
        size={[ROOM.w, ROOM.h]}
        lightMap={lightMap}
      />
      {/* -Z wall — facing +Z */}
      <FlatPlane
        position={[0, halfH, -halfD]}
        rotation={[0, 0, 0]}
        size={[ROOM.w, ROOM.h]}
        lightMap={lightMap}
      />
      {/* +X wall — facing -X */}
      <FlatPlane
        position={[halfW, halfH, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        size={[ROOM.d, ROOM.h]}
        lightMap={lightMap}
      />
      {/* -X wall — single shape with the carcosa door opening cut out, so the
          wall texture + lightmap span the whole surface continuously. */}
      <mesh position={[-halfW, 0, 0]} rotation={[0, Math.PI / 2, 0]} geometry={carcosaWallGeo}>
        <meshStandardMaterial
          color={WALL_COLOR}
          roughness={0.95}
          metalness={0}
          lightMap={lightMap}
          lightMapIntensity={1.0}
        />
      </mesh>
    </>
  )
}

export function Scene() {
  const roomLightmap = useMemo(() => makeRoomLightmap(), [])
  const floorLightmap = useMemo(() => makeFloorLightmap(), [])

  return (
    <>
      <ambientLight intensity={0.75} />
      <hemisphereLight args={[0xffffff, 0xdadada, 0.55]} />

      <MuseumRoom lightMap={roomLightmap} floorLightMap={floorLightmap} />

      {pedestalPositions.map(([x, z], i) => (
        <VoxelPedestal key={i} x={x} z={z} seed={i} name={ARTIFACT_NAMES[i % ARTIFACT_NAMES.length]} />
      ))}

      <ExitDoor />
      <SealFrame />
      <DebugDoor />
      <DebugFrame />
    </>
  )
}
