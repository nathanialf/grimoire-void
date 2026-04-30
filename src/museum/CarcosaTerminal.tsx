import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, CanvasTexture, NearestFilter, SRGBColorSpace } from 'three'
import { useFrame } from '@react-three/fiber'
import { variantTerminalFixture, WALL_Z } from './sceneConstants'
import { bootSequence, idleStatus } from './terminalLog/messages'

// Wall-mounted Marathon-1994-styled CRT next to the Carcosa door. Visual
// only — keyword input / known-variation list are deferred. The screen
// renders an animated green-on-black log: a fixed boot sequence followed
// by sprinkled idle-status lines that scroll up over time, mirroring the
// HUD terminal log so the prop reads like a sibling station.
//
// One CanvasTexture is reused; we redraw at ~6 fps (cheap; avoids
// rebuilding a texture every frame just to nudge a few characters).

const SCREEN_W_PX = 512
const SCREEN_H_PX = 384
const VISIBLE_LINES = 22
const LINE_HEIGHT_PX = 16
const TEXT_LEFT = 12
const TEXT_TOP = 14

const REDRAW_MS = 165
const PUSH_LINE_MIN_MS = 240
const PUSH_LINE_MAX_MS = 520
const IDLE_MIN_MS = 1200
const IDLE_MAX_MS = 4400

type Phase = { kind: 'boot'; bootIdx: number } | { kind: 'idle' }

interface ScreenState {
  lines: string[]
  phase: Phase
  nextPushAt: number
}

function paintScreen(ctx: CanvasRenderingContext2D, lines: string[], cursorOn: boolean): void {
  ctx.fillStyle = '#040806'
  ctx.fillRect(0, 0, SCREEN_W_PX, SCREEN_H_PX)

  // CRT-ish edge darken — quick radial-gradient stand-in via four rings.
  const grd = ctx.createRadialGradient(
    SCREEN_W_PX / 2,
    SCREEN_H_PX / 2,
    SCREEN_H_PX * 0.15,
    SCREEN_W_PX / 2,
    SCREEN_H_PX / 2,
    SCREEN_H_PX * 0.7,
  )
  grd.addColorStop(0, 'rgba(0,0,0,0)')
  grd.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, SCREEN_W_PX, SCREEN_H_PX)

  ctx.font = '13px "JetBrains Mono", ui-monospace, monospace'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#7cffa3'
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], TEXT_LEFT, TEXT_TOP + i * LINE_HEIGHT_PX)
  }

  if (cursorOn) {
    const y = TEXT_TOP + lines.length * LINE_HEIGHT_PX
    ctx.fillStyle = '#7cffa3'
    ctx.fillRect(TEXT_LEFT, y + 2, 8, LINE_HEIGHT_PX - 4)
  }

  // Faint scanlines overlay — every other row dimmed for CRT texture.
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  for (let y = 0; y < SCREEN_H_PX; y += 2) {
    ctx.fillRect(0, y, SCREEN_W_PX, 1)
  }
}

function pickPushDelay(): number {
  return PUSH_LINE_MIN_MS + Math.random() * (PUSH_LINE_MAX_MS - PUSH_LINE_MIN_MS)
}

function pickIdleDelay(): number {
  return IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS)
}

// Same radial halo recipe used by the museum pedestals (see
// makePedestalGlowTexture in Scene.tsx). Square-distance falloff so the
// halo stays rectangular against the screen rather than reading as a
// circle. Tuned for green phosphor: bright core, fast soft falloff.
function makeTerminalGlowTexture(): CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const stops: Array<[number, [number, number, number, number]]> = [
    [0.0,  [124, 255, 163, 0.95]],
    [0.55, [124, 255, 163, 0.55]],
    [0.85, [70,  220, 130, 0.18]],
    [1.0,  [40,  180, 100, 0.0]],
  ]
  const img = ctx.createImageData(size, size)
  const half = size / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.min(1, Math.max(Math.abs(x - half), Math.abs(y - half)) / half)
      let i = 0
      while (i < stops.length - 1 && d > stops[i + 1][0]) i++
      const [t0, c0] = stops[i]
      const [t1, c1] = stops[Math.min(i + 1, stops.length - 1)]
      const k = t1 === t0 ? 0 : (d - t0) / (t1 - t0)
      const r = c0[0] + (c1[0] - c0[0]) * k
      const gC = c0[1] + (c1[1] - c0[1]) * k
      const b = c0[2] + (c1[2] - c0[2]) * k
      const a = c0[3] + (c1[3] - c0[3]) * k
      const idx = (y * size + x) * 4
      img.data[idx + 0] = r
      img.data[idx + 1] = gC
      img.data[idx + 2] = b
      img.data[idx + 3] = Math.round(a * 255)
    }
  }
  ctx.putImageData(img, 0, 0)
  return new CanvasTexture(canvas)
}

function makeScreenTexture(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; tex: CanvasTexture } {
  const canvas = document.createElement('canvas')
  canvas.width = SCREEN_W_PX
  canvas.height = SCREEN_H_PX
  const ctx = canvas.getContext('2d')!
  const tex = new CanvasTexture(canvas)
  tex.magFilter = NearestFilter
  tex.minFilter = NearestFilter
  tex.generateMipmaps = false
  tex.colorSpace = SRGBColorSpace
  return { canvas, ctx, tex }
}

export function CarcosaTerminal() {
  const f = variantTerminalFixture
  const { ctx, tex } = useMemo(() => makeScreenTexture(), [])
  const haloTex = useMemo(() => makeTerminalGlowTexture(), [])

  const stateRef = useRef<ScreenState>({
    lines: [],
    phase: { kind: 'boot', bootIdx: 0 },
    nextPushAt: 0,
  })
  const lastDrawRef = useRef(0)
  const cursorOnRef = useRef(true)
  const lastCursorAt = useRef(0)
  const startedRef = useRef(false)

  useEffect(() => {
    paintScreen(ctx, [], true)
    tex.needsUpdate = true
  }, [ctx, tex])

  useFrame(({ clock }) => {
    const tMs = clock.elapsedTime * 1000

    if (!startedRef.current) {
      startedRef.current = true
      stateRef.current.nextPushAt = tMs + 200
    }

    const s = stateRef.current
    while (tMs >= s.nextPushAt) {
      let line: string
      if (s.phase.kind === 'boot') {
        const seq = bootSequence()
        line = seq[s.phase.bootIdx]
        s.phase = s.phase.bootIdx + 1 >= seq.length
          ? { kind: 'idle' }
          : { kind: 'boot', bootIdx: s.phase.bootIdx + 1 }
        s.nextPushAt = tMs + pickPushDelay()
      } else {
        line = idleStatus()
        s.nextPushAt = tMs + pickIdleDelay()
      }
      s.lines.push(line)
      if (s.lines.length > VISIBLE_LINES) s.lines.splice(0, s.lines.length - VISIBLE_LINES)
    }

    if (tMs - lastCursorAt.current > 460) {
      cursorOnRef.current = !cursorOnRef.current
      lastCursorAt.current = tMs
    }

    if (tMs - lastDrawRef.current >= REDRAW_MS) {
      lastDrawRef.current = tMs
      paintScreen(ctx, s.lines, cursorOnRef.current)
      tex.needsUpdate = true
    }
  })

  // Body is mounted flush against the wall; pivot is at the front-face
  // center so positioning matches the fixture constant.
  const halfD = f.depth / 2
  const bodyZ = WALL_Z + halfD

  // Screen is recessed slightly into the front face (z + depth - 0.005)
  // and inset from the bezel so the dark plastic frames it.
  const screenW = f.width * 0.78
  const screenH = f.height * 0.7
  const screenZ = WALL_Z + f.depth - 0.005

  return (
    <group>
      {/* CRT bezel / housing — chunky 1990s sci-fi monitor. */}
      <mesh position={[f.centerX, f.centerY, bodyZ]}>
        <boxGeometry args={[f.width, f.height, f.depth]} />
        <meshStandardMaterial
          color="#b6b8bc"
          roughness={0.78}
          metalness={0.05}
          emissive="#1c1c1e"
          emissiveIntensity={1.1}
        />
      </mesh>
      {/* Inner bezel — recessed dark lip framing the screen. */}
      <mesh position={[f.centerX, f.centerY, screenZ - 0.002]}>
        <boxGeometry args={[screenW + 0.04, screenH + 0.04, 0.01]} />
        <meshStandardMaterial
          color="#3a3c40"
          roughness={0.9}
          metalness={0}
          emissive="#0a0a0c"
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* Screen plane — emissive map = the texture itself, so it glows
          regardless of room light and survives bloom from the post-stack. */}
      <mesh position={[f.centerX, f.centerY, screenZ]}>
        <planeGeometry args={[screenW, screenH]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* Tiny indicator LED bottom-right of the bezel — green to match the
          screen text, sells the "powered" state. */}
      <mesh position={[f.centerX + f.width / 2 - 0.06, f.centerY - f.height / 2 + 0.05, bodyZ + halfD + 0.001]}>
        <boxGeometry args={[0.02, 0.02, 0.005]} />
        <meshBasicMaterial color="#7cffa3" toneMapped={false} />
      </mesh>
      {/* Additive bloom-halo just beyond the screen edge — bleeds onto
          the bezel for a CRT-glow rim but stays within the terminal's
          own footprint (no spill onto the wall, floor, or nearby
          fixtures). The plane sits a hair forward of the screen plane
          to avoid z-fighting at distance. */}
      <mesh position={[f.centerX, f.centerY, screenZ + 0.006]}>
        <planeGeometry args={[Math.min(screenW * 1.2, f.width * 0.95), Math.min(screenH * 1.3, f.height * 0.95)]} />
        <meshBasicMaterial
          map={haloTex}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
