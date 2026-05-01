import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Group, NearestFilter, SRGBColorSpace } from 'three'
import { useThree } from '@react-three/fiber'
import { toolMountFixture, toolMountRotationY } from './sceneConstants'
import { type Cartridge, useInventory } from '../data/inventory'

// Tool geometry (shared by wall mount + held). Body, grip, scope.
const TOOL_BODY = { w: 0.34, h: 0.09, d: 0.13 } as const
const TOOL_GRIP = { w: 0.06, h: 0.13, d: 0.1 } as const
const TOOL_SCOPE = { w: 0.18, h: 0.07, d: 0.08 } as const
const SCOPE_SCREEN = { w: 0.15, h: 0.05 } as const

const SCOPE_W_PX = 256
const SCOPE_H_PX = 96

// Build the scope screen text from the held cart. Null cart → EMPTY.
// Blank cart (no slug yet) → BLANK 0 REC. Bound cart → SLUG \n N REC.
function scopeLines(cart: Cartridge | null): { line1: string; line2: string; tone: 'empty' | 'blank' | 'live' } {
  if (!cart) return { line1: 'EMPTY', line2: '— —', tone: 'empty' }
  const count = Object.values(cart.gathered).filter(Boolean).length
  if (cart.slug === null) return { line1: 'BLANK', line2: '0 REC', tone: 'blank' }
  return { line1: cart.slug.toUpperCase(), line2: `${count} REC`, tone: 'live' }
}

function paintScope(
  ctx: CanvasRenderingContext2D,
  line1: string,
  line2: string,
  tone: 'empty' | 'blank' | 'live',
): void {
  ctx.fillStyle = '#040806'
  ctx.fillRect(0, 0, SCOPE_W_PX, SCOPE_H_PX)
  const color = tone === 'empty' ? '#7a7a7a' : tone === 'blank' ? '#ffb84d' : '#7cffa3'
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.font = '900 30px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText(line1, SCOPE_W_PX / 2, 26)
  ctx.font = '900 20px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText(line2, SCOPE_W_PX / 2, 66)
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
      {/* Scope housing on top of the body. */}
      <mesh position={[TOOL_BODY.w / 2 - TOOL_SCOPE.w / 2 - 0.02, TOOL_BODY.h / 2 + TOOL_SCOPE.h / 2 - 0.005, 0]}>
        <boxGeometry args={[TOOL_SCOPE.w, TOOL_SCOPE.h, TOOL_SCOPE.d]} />
        <meshStandardMaterial
          color="#e8e4dc"
          roughness={0.95}
          metalness={0}
          emissive="#1a1814"
          emissiveIntensity={8}
        />
      </mesh>
      {/* Scope screen — sits on top face of the scope housing, slightly
          recessed so the bezel reads. */}
      <mesh
        position={[
          TOOL_BODY.w / 2 - TOOL_SCOPE.w / 2 - 0.02,
          TOOL_BODY.h / 2 + TOOL_SCOPE.h - 0.001,
          0,
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
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
    paintScope(ctx, 'EMPTY', '— —', 'empty')
    tex.needsUpdate = true
  }, [ctx, tex])

  if (inv.tool.equipped) return null

  return (
    <group position={f.center} rotation={[0, toolMountRotationY, 0]}>
      <ToolModel screenTex={tex} />
    </group>
  )
}

// Held tool — camera-parented so it follows the view 1:1. Renders nothing
// until the player picks the tool up. Lives at the top level of the
// Canvas (not inside the museum/carcosa visibility groups) so it persists
// across scene swaps without re-mounting.
export function HeldTool() {
  const inv = useInventory()
  const { camera, scene } = useThree()
  const groupRef = useRef<Group>(null)
  const { ctx, tex } = useMemo(() => makeScopeTexture(), [])

  // Repaint scope whenever the cart changes shape.
  useEffect(() => {
    const { line1, line2, tone } = scopeLines(inv.cart)
    paintScope(ctx, line1, line2, tone)
    tex.needsUpdate = true
  }, [ctx, tex, inv.cart])

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

  // Lower-right framing, slight inward tilt. Render the tool with a
  // subtle scale so it reads at FPS proportions.
  return (
    <group ref={groupRef} position={[0.22, -0.18, -0.5]} rotation={[0, -0.32, -0.06]} scale={0.7}>
      <ToolModel screenTex={tex} />
    </group>
  )
}
