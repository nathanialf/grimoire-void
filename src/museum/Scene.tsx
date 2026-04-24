import { useEffect, useMemo, useRef, useState } from 'react'
import { BackSide, CanvasTexture, NearestFilter, RepeatWrapping, SRGBColorSpace, type Group } from 'three'
import { useFrame } from '@react-three/fiber'
import { ROOM, PEDESTAL_SIZE, pedestalPositions, EXIT_Z_POS, ARTIFACT_NAMES } from './sceneConstants'

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

// QR-code-flavored palettes — dark ink on a white base, plus one vivid accent.
const ARTIFACT_PALETTES: { base: string; ink: string; accent: string }[] = [
  { base: '#f4f4f4', ink: '#0a0a0a', accent: '#ff1844' },
  { base: '#f2effa', ink: '#120c1e', accent: '#7a2aff' },
  { base: '#f1f8f4', ink: '#082014', accent: '#00aa55' },
  { base: '#fbf0f4', ink: '#1a0812', accent: '#ff00aa' },
  { base: '#eef4fa', ink: '#081424', accent: '#0088ff' },
  { base: '#faf4ec', ink: '#1f1409', accent: '#ff6e00' },
]

function makeArtifactTexture(
  seed: number,
  opts: { ombre: boolean; aspect?: number } = { ombre: true },
): CanvasTexture {
  const cellsX = 64
  const aspect = opts.aspect ?? 1 // height / width
  const cellsY = Math.max(8, Math.round(cellsX * aspect))
  const pixel = 12
  const width = cellsX * pixel
  const height = cellsY * pixel
  const rand = seeded(seed + 1)
  const { base, ink, accent } = ARTIFACT_PALETTES[seed % ARTIFACT_PALETTES.length]

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)

  // Ombre dissolve from dense-at-bottom fading up, OR sparse uniform noise
  // (so the light base dominates and accents/ink speckle across the surface).
  const densityAt = (_x: number, y: number) =>
    opts.ombre ? y / (cellsY - 1) : 1

  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      const d = densityAt(x, y)
      const threshold = opts.ombre ? 0.05 + d * 0.85 : 0.62
      const r = rand()
      if (r < threshold * 0.8) {
        ctx.fillStyle = ink
        ctx.fillRect(x * pixel, y * pixel, pixel, pixel)
      } else if (r < threshold) {
        ctx.fillStyle = accent
        ctx.fillRect(x * pixel, y * pixel, pixel, pixel)
      }
    }
  }

  const tex = new CanvasTexture(canvas)
  tex.magFilter = NearestFilter
  tex.minFilter = NearestFilter
  tex.generateMipmaps = false
  tex.colorSpace = SRGBColorSpace
  return tex
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

const DOOR_W = 1.2
const DOOR_H = 2.2
const DOOR_CY = 1.1
const FRAME_W = 0.12

function ExitDoor() {
  // Pre-generate a handful of aspect-corrected noise textures with different
  // seeds, then cycle the door's map through them every few seconds so the
  // sealed panel "pulses" / "re-scans" in place. Rotate 180° on Y so the
  // plane's front face points into the room interior.
  const textures = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) =>
        makeArtifactTexture(99 + i * 17, { ombre: false, aspect: DOOR_H / DOOR_W }),
      ),
    [],
  )
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx((n) => (n + 1) % textures.length), 3000)
    return () => clearInterval(id)
  }, [textures.length])

  // Position the door just in front of the wall but BEHIND the seal strips,
  // so the strips (at zFront = EXIT_Z_POS - 0.005) render on top and the
  // bottom strip isn't occluded by the door.
  return (
    <mesh position={[0, DOOR_CY, EXIT_Z_POS - 0.001]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[DOOR_W, DOOR_H]} />
      <meshStandardMaterial map={textures[idx]} roughness={0.9} metalness={0} />
    </mesh>
  )
}

function SealFrame() {
  const { canvas } = useMemo(() => makeSealTickerCanvas(), [])

  // Each strip gets its own CanvasTexture clone so rotation / repeat / offset
  // can differ per strip. Rotation orientation traces a clockwise drum around
  // the frame: top upright, right top-down, bottom upside-down, left bottom-up.
  const textures = useMemo(() => {
    const make = (rotation: number) => {
      const t = new CanvasTexture(canvas)
      t.wrapS = RepeatWrapping
      t.wrapT = RepeatWrapping
      t.anisotropy = 4
      t.center.set(0.5, 0.5)
      t.rotation = rotation
      return t
    }
    return {
      top: make(0),
      right: make(Math.PI / 2),
      bottom: make(Math.PI),
      left: make(-Math.PI / 2),
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas])

  useFrame((_, dt) => {
    const d = dt * 0.05
    // All four strips advance offset.x in the same direction. With the
    // per-strip texture rotations (top 0, right π/2, bottom π, left -π/2),
    // identical UV motion maps to a single continuous circulation around the
    // frame perimeter.
    textures.top.offset.x = (textures.top.offset.x + d) % 1
    textures.right.offset.x = (textures.right.offset.x + d) % 1
    textures.bottom.offset.x = (textures.bottom.offset.x + d) % 1
    textures.left.offset.x = (textures.left.offset.x + d) % 1
  })

  // Aspect correction: one canvas "copy" spans msgWidth/h; we set repeat so
  // the strip samples the right amount for its physical size.
  const canvasAspect = canvas.width / canvas.height
  const topAspect = (DOOR_W + 2 * FRAME_W) / FRAME_W
  const sideAspect = DOOR_H / FRAME_W
  textures.top.repeat.x = topAspect / canvasAspect
  textures.bottom.repeat.x = topAspect / canvasAspect
  textures.left.repeat.x = sideAspect / canvasAspect
  textures.right.repeat.x = sideAspect / canvasAspect

  const zFront = EXIT_Z_POS - 0.005 // slightly in front of the door/wall
  const outerLeft = -DOOR_W / 2 - FRAME_W / 2
  const outerRight = DOOR_W / 2 + FRAME_W / 2
  const outerTop = DOOR_H + FRAME_W / 2
  const outerBottom = -FRAME_W / 2

  return (
    <>
      {/* Top strip */}
      <mesh position={[0, outerTop, zFront]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[DOOR_W + 2 * FRAME_W, FRAME_W]} />
        <meshBasicMaterial map={textures.top} toneMapped={false} />
      </mesh>
      {/* Bottom strip */}
      <mesh position={[0, Math.max(outerBottom, FRAME_W / 2), zFront]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[DOOR_W + 2 * FRAME_W, FRAME_W]} />
        <meshBasicMaterial map={textures.bottom} toneMapped={false} />
      </mesh>
      {/* Left strip */}
      <mesh position={[outerLeft, DOOR_CY, zFront]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[FRAME_W, DOOR_H]} />
        <meshBasicMaterial map={textures.left} toneMapped={false} />
      </mesh>
      {/* Right strip */}
      <mesh position={[outerRight, DOOR_CY, zFront]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[FRAME_W, DOOR_H]} />
        <meshBasicMaterial map={textures.right} toneMapped={false} />
      </mesh>
      {/* White corner caps — 80% of the ticker band so a thin red border shows
          around them. z slightly in front so they win depth over the strips. */}
      {[
        [outerLeft, outerTop],
        [outerRight, outerTop],
        [outerLeft, Math.max(outerBottom, FRAME_W / 2)],
        [outerRight, Math.max(outerBottom, FRAME_W / 2)],
      ].map(([cx, cy], i) => (
        <mesh key={i} position={[cx, cy, zFront - 0.001]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[FRAME_W * 0.8, FRAME_W * 0.8]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}

function Pedestal({ x, z, seed, name }: { x: number; z: number; seed: number; name: string }) {
  const tex = useMemo(() => makeArtifactTexture(seed), [seed])
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, PEDESTAL_SIZE / 2, 0]}>
        <boxGeometry args={[PEDESTAL_SIZE, PEDESTAL_SIZE, PEDESTAL_SIZE]} />
        {/* Face order: +X, -X, +Y (top), -Y (bottom), +Z, -Z */}
        <meshStandardMaterial attach="material-0" map={tex} roughness={0.85} metalness={0} />
        <meshStandardMaterial attach="material-1" map={tex} roughness={0.85} metalness={0} />
        <meshStandardMaterial attach="material-2" color="#f4f4f4" roughness={0.85} metalness={0} />
        <meshStandardMaterial attach="material-3" map={tex} roughness={0.85} metalness={0} />
        <meshStandardMaterial attach="material-4" map={tex} roughness={0.85} metalness={0} />
        <meshStandardMaterial attach="material-5" map={tex} roughness={0.85} metalness={0} />
      </mesh>
      <PedestalTicker />
      <FloatingLabel name={name} seed={seed} />
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
  // Soft pedestal shadow ovals, drawn with globalCompositeOperation='multiply'
  // so the radial gradient's transparent outer edge doesn't leave a visible
  // rectangular fill border where fillRect wrote rgba(0,0,0,0) pixels.
  ctx.globalCompositeOperation = 'multiply'
  for (const [x, z] of pedestalPositions) {
    const cx = size / 2 + (x / (ROOM.w / 2)) * (size / 2 - 20)
    const cy = size / 2 + (z / (ROOM.d / 2)) * (size / 2 - 20)
    const sh = ctx.createRadialGradient(cx, cy, 4, cx, cy, 28)
    sh.addColorStop(0, 'rgba(80,80,80,1)')
    sh.addColorStop(1, 'rgba(255,255,255,1)')
    ctx.fillStyle = sh
    ctx.beginPath()
    ctx.arc(cx, cy, 28, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = RepeatWrapping
  return tex
}

export function Scene() {
  const roomLightmap = useMemo(() => makeRoomLightmap(), [])
  const floorLightmap = useMemo(() => makeFloorLightmap(), [])

  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={[0xffffff, 0xb0b0b0, 0.25]} />

      <mesh position={[0, ROOM.h / 2, 0]}>
        <boxGeometry args={[ROOM.w, ROOM.h, ROOM.d]} />
        <meshStandardMaterial
          side={BackSide}
          color="#f5f5f5"
          roughness={0.95}
          metalness={0}
          lightMap={roomLightmap}
          lightMapIntensity={1.0}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color="#eaeaea" roughness={0.95} metalness={0} lightMap={floorLightmap} lightMapIntensity={1.0} />
      </mesh>

      {pedestalPositions.map(([x, z], i) => (
        <Pedestal key={i} x={x} z={z} seed={i} name={ARTIFACT_NAMES[i % ARTIFACT_NAMES.length]} />
      ))}

      <ExitDoor />
      <SealFrame />
    </>
  )
}
