import { useEffect, useMemo, useState } from 'react'
import { BufferAttribute, BufferGeometry, CanvasTexture, NearestFilter, SRGBColorSpace } from 'three'
// `CanvasTexture` and `SRGBColorSpace` retained for the portal noise texture.
import { DOOR_W, DOOR_H, DOOR_CY, FrameTicker, makeDebugTickerCanvas } from './frameTicker'

export const PORTAL_Z = -10

function seeded(seed: number) {
  let s = (seed * 2654435761) >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-9)
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// 2-arm log-spiral galaxy as black point-stars on a disc, translated
// off-center to a corner of the sky so it reads as a distant galaxy in the
// upper-front field of view rather than directly overhead. Positioned at
// +X / +Z so it sits in the upper-front-right of a player spawning at the
// return portal and facing +Z.
const GALAXY_OFFSET: [number, number, number] = [220, 200, 400]

// Approximate spawn pose used to orient the disc plane facing back toward
// the player so the spiral structure is visible face-on instead of edge-on.
const SPAWN_FOR_FACING: [number, number, number] = [0, 1.6, -8.8]

// Build an orthonormal disc basis (u, v) such that the disc plane's normal
// points from the galaxy back toward the spawn camera, then slightly tilt
// the disc around u so the spiral reads as an oblique ellipse with depth
// rather than a perfectly face-on circle.
function makeDiscBasis(): {
  u: [number, number, number]
  v: [number, number, number]
} {
  const dx = GALAXY_OFFSET[0] - SPAWN_FOR_FACING[0]
  const dy = GALAXY_OFFSET[1] - SPAWN_FOR_FACING[1]
  const dz = GALAXY_OFFSET[2] - SPAWN_FOR_FACING[2]
  const len = Math.hypot(dx, dy, dz) || 1
  // Disc normal points from galaxy back at the spawn (i.e. toward viewer).
  const nx = -dx / len
  const ny = -dy / len
  const nz = -dz / len
  // u = normalize(n × worldUp) — horizontal axis in disc plane.
  let ux = ny * 0 - nz * 1
  let uy = nz * 0 - nx * 0
  let uz = nx * 1 - ny * 0
  const ulen = Math.hypot(ux, uy, uz) || 1
  ux /= ulen; uy /= ulen; uz /= ulen
  // v = n × u — orthogonal to u, lies in disc plane (vertical-ish axis).
  const vx = ny * uz - nz * uy
  const vy = nz * ux - nx * uz
  const vz = nx * uy - ny * ux
  // Tilt: rotate disc around u by TILT so v gets a small +n component.
  // Pushes the "top" of the disc toward the viewer, "bottom" away — the disc
  // appears as a tilted ellipse instead of a flat face-on circle.
  const TILT = Math.PI * 0.22
  const cosT = Math.cos(TILT)
  const sinT = Math.sin(TILT)
  const vTx = vx * cosT + nx * sinT
  const vTy = vy * cosT + ny * sinT
  const vTz = vz * cosT + nz * sinT
  return { u: [ux, uy, uz], v: [vTx, vTy, vTz] }
}

function makeGalaxyGeometry(): BufferGeometry {
  const COUNT = 35000
  const BULGE_FRAC = 0.3
  const ARM_TIGHTNESS = 0.32
  const ARM_RADIAL_JITTER = 6
  const ARM_ANGULAR_JITTER = 0.45

  const { u, v } = makeDiscBasis()

  const positions = new Float32Array(COUNT * 3)
  const rand = seeded(7)

  for (let i = 0; i < COUNT; i++) {
    let dx: number
    let dy: number
    if (rand() < BULGE_FRAC) {
      dx = gaussian(rand) * 18
      dy = gaussian(rand) * 14
    } else {
      const t = 0.4 + rand() * 3.6
      const arm = i % 2 === 0 ? 0 : Math.PI
      const r = Math.exp(t * ARM_TIGHTNESS) * 9 + (rand() - 0.5) * ARM_RADIAL_JITTER
      const theta = t * 2.4 + arm + (rand() - 0.5) * ARM_ANGULAR_JITTER
      dx = Math.cos(theta) * r
      dy = Math.sin(theta) * r
    }

    // Map disc-plane (dx, dy) to world using the orthonormal basis.
    positions[i * 3 + 0] = GALAXY_OFFSET[0] + dx * u[0] + dy * v[0]
    positions[i * 3 + 1] = GALAXY_OFFSET[1] + dx * u[1] + dy * v[1]
    positions[i * 3 + 2] = GALAXY_OFFSET[2] + dx * u[2] + dy * v[2]
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  return geo
}

// Ambient star field across the whole sky dome (above horizon). Black points
// against the white sky; high count + larger size so individual stars survive
// the bloom halo around the bright white sky background.
function makeSkyStarsGeometry(): BufferGeometry {
  const COUNT = 40000
  const RADIUS_NEAR = 350
  const RADIUS_FAR = 900
  const positions = new Float32Array(COUNT * 3)
  const rand = seeded(91)

  for (let i = 0; i < COUNT; i++) {
    // Uniform on hemisphere (y >= 0): sample direction, then scale by random
    // radius in [near, far] for parallax-ish depth.
    let x = 0, y = 0, z = 0, len = 0
    do {
      x = rand() * 2 - 1
      y = rand() // upper hemisphere only
      z = rand() * 2 - 1
      len = Math.hypot(x, y, z)
    } while (len < 1e-6 || len > 1)
    x /= len; y /= len; z /= len
    const r = RADIUS_NEAR + rand() * (RADIUS_FAR - RADIUS_NEAR)
    positions[i * 3 + 0] = x * r
    positions[i * 3 + 1] = y * r + 30 // lift just above horizon
    positions[i * 3 + 2] = z * r
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  return geo
}

// Cosmic-dust cloud — dense excess of small star-like points clustered around
// the galaxy and trailing across the sky. Same visual language as the sky
// stars (small black dots) just much denser, so it reads as a star excess /
// dust lane rather than separate fuzzy blobs.
function makeDustGeometry(): BufferGeometry {
  const COUNT = 35000
  const positions = new Float32Array(COUNT * 3)
  const rand = seeded(53)

  for (let i = 0; i < COUNT; i++) {
    // 75% cluster tightly around the galaxy plane to densify the spiral
    // arms; 25% drift across the rest of the sky dome for ambient density.
    if (rand() < 0.75) {
      positions[i * 3 + 0] = GALAXY_OFFSET[0] + gaussian(rand) * 110
      positions[i * 3 + 1] = GALAXY_OFFSET[1] + gaussian(rand) * 40
      positions[i * 3 + 2] = GALAXY_OFFSET[2] + gaussian(rand) * 110
    } else {
      // Random dome direction.
      let x = 0, y = 0, z = 0, len = 0
      do {
        x = rand() * 2 - 1
        y = rand() * 0.9 + 0.1
        z = rand() * 2 - 1
        len = Math.hypot(x, y, z)
      } while (len < 1e-6 || len > 1)
      x /= len; y /= len; z /= len
      const r = 250 + rand() * 500
      positions[i * 3 + 0] = x * r
      positions[i * 3 + 1] = y * r + 30
      positions[i * 3 + 2] = z * r
    }
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  return geo
}

function makePortalNoiseTexture(seed: number): CanvasTexture {
  const cellsX = 64
  const cellsY = Math.round(cellsX * (DOOR_H / DOOR_W))
  const pixel = 12
  const w = cellsX * pixel
  const h = cellsY * pixel
  const rand = seeded(seed)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)

  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      const r = rand()
      if (r < 0.04) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x * pixel, y * pixel, pixel, pixel)
      } else if (r < 0.08) {
        ctx.fillStyle = '#444444'
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

function ReturnPortal() {
  const textures = useMemo(
    () => Array.from({ length: 5 }, (_, i) => makePortalNoiseTexture(401 + i * 19)),
    [],
  )
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx((n) => (n + 1) % textures.length), 1800)
    return () => clearInterval(id)
  }, [textures.length])

  // Faces +Z (toward the player at spawn). Door panel only — frame is drawn
  // separately by ReturnPortalFrame so the ticker strips can render in front.
  return (
    <mesh position={[0, DOOR_CY, PORTAL_Z]}>
      <planeGeometry args={[DOOR_W, DOOR_H]} />
      <meshBasicMaterial map={textures[idx]} toneMapped={false} />
    </mesh>
  )
}

function ReturnPortalFrame() {
  const { canvas } = useMemo(() => makeDebugTickerCanvas(), [])
  // Portal faces +Z (rotationY = 0); strips sit at PORTAL_Z + 0.005, slightly
  // closer to the spawn camera at z=0.
  return (
    <FrameTicker
      canvas={canvas}
      centerX={0}
      centerY={DOOR_CY}
      centerZ={PORTAL_Z}
      rotationY={0}
      outwardOffset={0.005}
      wallAxis="x"
      cornerColor="#ff0000"
      mirrorSides
    />
  )
}

export function CarcosaScene() {
  const galaxyGeo = useMemo(() => makeGalaxyGeometry(), [])
  const skyStarsGeo = useMemo(() => makeSkyStarsGeometry(), [])
  const dustGeo = useMemo(() => makeDustGeometry(), [])

  return (
    <>
      {/* Flat lighting; no directional light → no shadows. */}
      <ambientLight intensity={0.9} />

      {/* Bright red ground. Basic material so saturation holds across the
          whole horizon (no lighting falloff darkening distant ground). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial color="#e8202a" toneMapped={false} />
      </mesh>

      {/* Cosmic dust — dense small star-like points concentrated around the
          galaxy, reading as an excess of stars / nebular speckle rather than
          discrete blobs. Sized larger than ambient stars so they punch
          through the bloom halo without smearing into the white sky. */}
      <points geometry={dustGeo}>
        <pointsMaterial
          color="#000000"
          size={2}
          sizeAttenuation
          toneMapped={false}
        />
      </points>

      {/* Sky stars — black points filling the whole upper hemisphere. */}
      <points geometry={skyStarsGeo}>
        <pointsMaterial color="#000000" size={2.5} sizeAttenuation toneMapped={false} />
      </points>

      {/* Galaxy — denser cluster of stars off in a corner of the sky. */}
      <points geometry={galaxyGeo}>
        <pointsMaterial color="#000000" size={3} sizeAttenuation toneMapped={false} />
      </points>

      <ReturnPortal />
      <ReturnPortalFrame />
    </>
  )
}

export const returnPortalZone = {
  minX: -0.9,
  maxX: 0.9,
  minZ: PORTAL_Z,
  maxZ: PORTAL_Z + 0.9,
}
