import { useMemo, useRef, useState } from 'react'
import { BackSide, BufferAttribute, BufferGeometry, Group, Matrix4, Quaternion, Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
import { DOOR_W, DOOR_H, DOOR_CY, FrameTicker, makeDebugTickerCanvas } from './frameTicker'
import { useRevealedArtifactTexture, DOOR_ANIM_RADIUS } from './Scene'
import { Node } from './Node'
import type { Variation } from '../data/variations'
import { useVisionTier, type VisionTier } from '../data/settings'

// On entering a variation the suit takes a brief, full-fidelity reading of
// Carcosa before sensors overload and force the dropdown to the player's
// current upgrade tier ("one-shot per run", per
// docs/private/systems/vision-and-suit.md). The full sequence — exposure
// hold + shutter close + tier swap + shutter open — is orchestrated in
// MuseumPage so it can drive the DOM visor overlay; the constants there
// also export the boolean we read here.
export const GLIMPSE_EXPOSURE_MS = 1000
export const VISOR_SHUTTER_CLOSE_MS = 260
export const VISOR_SHUTTER_HOLD_MS = 80
export const VISOR_SHUTTER_OPEN_MS = 260

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

// Build an orthonormal disc basis (u, v, n) such that the disc plane's normal
// points from the galaxy back toward the spawn camera, then slightly tilt
// the disc around u so the spiral reads as an oblique ellipse with depth
// rather than a perfectly face-on circle.
function makeDiscBasis(): {
  u: [number, number, number]
  v: [number, number, number]
  n: [number, number, number]
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
  // Tilt: rotate disc around u by TILT so v and n both rotate.
  // Pushes the "top" of the disc toward the viewer, "bottom" away — the disc
  // appears as a tilted ellipse instead of a flat face-on circle.
  const TILT = Math.PI * 0.28
  const cosT = Math.cos(TILT)
  const sinT = Math.sin(TILT)
  const vTx = vx * cosT + nx * sinT
  const vTy = vy * cosT + ny * sinT
  const vTz = vz * cosT + nz * sinT
  let nTx = nx * cosT - vx * sinT
  let nTy = ny * cosT - vy * sinT
  let nTz = nz * cosT - vz * sinT
  // Yaw: rotate around worldUp so the disc isn't symmetric to the line of
  // sight — adds a sideways skew so the ellipse turns away from head-on.
  const YAW = Math.PI * 0.1
  const cosY = Math.cos(YAW)
  const sinY = Math.sin(YAW)
  const uRx = ux * cosY + uz * sinY
  const uRz = -ux * sinY + uz * cosY
  const nRx = nTx * cosY + nTz * sinY
  const nRz = -nTx * sinY + nTz * cosY
  const vRx = vTx * cosY + vTz * sinY
  const vRz = -vTx * sinY + vTz * cosY
  return {
    u: [uRx, uy, uRz],
    v: [vRx, vTy, vRz],
    n: [nRx, nTy, nRz],
  }
}

// Galaxy stars in disc-local coordinates: x along the disc's u axis, y along
// v, z = 0. The parent group applies GALAXY_OFFSET + the disc basis, so this
// geometry can be spun around its local z (the disc normal) without rebuilding.
function makeGalaxyGeometry(): BufferGeometry {
  const COUNT = 7000
  const BULGE_FRAC = 0.08
  const ARM_TIGHTNESS = 0.3
  const ARM_RADIAL_JITTER = 10
  const ARM_ANGULAR_JITTER = 0.32
  // Anisotropic stretch of the disc plane — pulls the whole shape into an
  // elongated oval along u (the disc's horizontal axis).
  const STRETCH_U = 1.7
  const STRETCH_V = 0.85

  const positions = new Float32Array(COUNT * 3)
  const rand = seeded(7)

  for (let i = 0; i < COUNT; i++) {
    let dx: number
    let dy: number
    if (rand() < BULGE_FRAC) {
      dx = gaussian(rand) * 9
      dy = gaussian(rand) * 7
    } else {
      // Power-weighted t so most stars cluster inward and only a thin tail
      // reaches the outer arm — feathers the galaxy edge instead of stopping
      // at a hard radius. Jitters grow with t so outer stars spread wider.
      const t = 0.4 + Math.pow(rand(), 1.7) * 4.4
      const arm = i % 2 === 0 ? 0 : Math.PI
      const radialScatter = ARM_RADIAL_JITTER * (1 + t * 0.6)
      const angularScatter = ARM_ANGULAR_JITTER * (1 + t * 0.35)
      const r = Math.exp(t * ARM_TIGHTNESS) * 20 + (rand() - 0.5) * radialScatter
      const theta = t * 2.4 + arm + (rand() - 0.5) * angularScatter
      dx = Math.cos(theta) * r
      dy = Math.sin(theta) * r
    }

    positions[i * 3 + 0] = dx * STRETCH_U
    positions[i * 3 + 1] = dy * STRETCH_V
    positions[i * 3 + 2] = 0
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

// Disc-plane dust cluster — densifies the spiral arms. Disc-local coordinates
// (x = u, y = v, z = n), so the parent group orients + spins it with the galaxy.
function makeDustDiscGeometry(): BufferGeometry {
  const COUNT = 26000
  const positions = new Float32Array(COUNT * 3)
  const rand = seeded(53)

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3 + 0] = gaussian(rand) * 90
    positions[i * 3 + 1] = gaussian(rand) * 90
    positions[i * 3 + 2] = gaussian(rand) * 12
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  return geo
}

// Tier-1 ground: subdivided plane carrying per-vertex colors that lerp
// from the full red ground tone at the player's feet to pure black at
// the edges. Renders as wireframe at tier 1, so the lines themselves
// inherit the gradient and dissolve into the black skybox at the
// horizon — gives the ground a near-the-player presence without
// pretending to extend infinitely. Pre-rotation, the plane sits in the
// XY plane; distance-from-center in (x, y) is distance-from-origin on
// the rotated horizontal ground.
const TIER1_GROUND_FADE_RADIUS = 50
function makeTier1GroundGeometry(): BufferGeometry {
  const SIZE = 2000
  const SEGMENTS = 48
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  const RED = [0xe8 / 255, 0x20 / 255, 0x2a / 255] as const
  const half = SIZE / 2
  const step = SIZE / SEGMENTS
  for (let j = 0; j <= SEGMENTS; j++) {
    for (let i = 0; i <= SEGMENTS; i++) {
      const x = -half + i * step
      const y = -half + j * step
      positions.push(x, y, 0)
      const t = Math.min(Math.hypot(x, y) / TIER1_GROUND_FADE_RADIUS, 1)
      const k = 1 - t
      colors.push(RED[0] * k, RED[1] * k, RED[2] * k)
    }
  }
  for (let j = 0; j < SEGMENTS; j++) {
    for (let i = 0; i < SEGMENTS; i++) {
      const a = j * (SEGMENTS + 1) + i
      const b = a + 1
      const c = a + (SEGMENTS + 1)
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geo.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
  geo.setIndex(indices)
  return geo
}

// Static dome dust — ambient density across the upper hemisphere, world-space.
// Stays put while the galaxy spins.
function makeDustDomeGeometry(): BufferGeometry {
  const COUNT = 9000
  const positions = new Float32Array(COUNT * 3)
  const rand = seeded(54)

  for (let i = 0; i < COUNT; i++) {
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

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  return geo
}

// Black base + white ink + saturated yellow accent. The previous gray accent
// (#444) was reading as drab/transparent next to the white ink — yellow gives
// the portal pop highlights a complementary tone against the red ground.
const PORTAL_PALETTE = { base: '#000000', ink: '#ffffff', accent: '#ffd400' }

function ReturnPortal({ tier }: { tier: VisionTier }) {
  const [idx, setIdx] = useState(0)
  const cycleAccum = useRef(0)
  useFrame(({ camera }, delta) => {
    const dx = camera.position.x - 0
    const dy = camera.position.y - DOOR_CY
    const dz = camera.position.z - PORTAL_Z
    if (Math.hypot(dx, dy, dz) >= DOOR_ANIM_RADIUS) return
    cycleAccum.current += delta * 1000
    if (cycleAccum.current >= 1800) {
      cycleAccum.current = 0
      setIdx((n) => (n + 1) % 5)
    }
  })
  // Same per-pixel reveal animation the museum doors use, with a black/white
  // palette and the portal's sparse noise density. Skipped at tier<2: the
  // texture isn't visible on a wireframe or vertex-only render.
  const tex = useRevealedArtifactTexture(
    401 + idx * 19,
    {
      ombre: false,
      aspect: DOOR_H / DOOR_W,
      palette: PORTAL_PALETTE,
      density: 0.08,
      inkFraction: 0.5,
      // Red perimeter ink — matches the return portal's red FrameTicker.
      edgeInk: { thickness: 12, color: '#ff0000' },
    },
    900,
  )

  if (tier === 0) {
    // Subdivide the door plane so its vertex grid reads as a door
    // silhouette (~7×13 dot grid) rather than just four corner points.
    // The exit is the only thing the player needs to find at tier 0, so
    // it gets the densest dot pattern of any tier-0 element.
    return (
      <points position={[0, DOOR_CY, PORTAL_Z]}>
        <planeGeometry args={[DOOR_W, DOOR_H, 6, 12]} />
        <pointsMaterial color="#ffffff" size={4} sizeAttenuation={false} toneMapped={false} />
      </points>
    )
  }

  if (tier === 1) {
    // Tier-1 wireframe — was a single `<mesh wireframe>` with
    // wireframeLinewidth={2}, but most WebGL implementations clamp
    // line width to 1 pixel (driver limit), so on HiDPI the door
    // read as faint dots. We render the same outline-plus-diagonal
    // pattern as four long thin emissive plane segments so the
    // bloom catches them and the line thickness is consistent
    // across every entry path. Each segment is `1.4 * BLOOM_LIFT`
    // emissive so the green/white phosphor rim survives the
    // EffectComposer chain (Bloom → ColorGrade → CA → Halation)
    // even when the surrounding scene is dim.
    const t = 0.012
    return (
      <group position={[0, DOOR_CY, PORTAL_Z]}>
        {/* top */}
        <mesh position={[0, DOOR_H / 2, 0]}>
          <planeGeometry args={[DOOR_W, t]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        {/* bottom */}
        <mesh position={[0, -DOOR_H / 2, 0]}>
          <planeGeometry args={[DOOR_W, t]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        {/* left */}
        <mesh position={[-DOOR_W / 2, 0, 0]}>
          <planeGeometry args={[t, DOOR_H]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        {/* right */}
        <mesh position={[DOOR_W / 2, 0, 0]}>
          <planeGeometry args={[t, DOOR_H]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        {/* diagonal — bottom-left to top-right. Built as a thin
            plane rotated to the diagonal angle. */}
        <mesh
          position={[0, 0, 0]}
          rotation={[0, 0, Math.atan2(DOOR_H, DOOR_W)]}
        >
          <planeGeometry args={[Math.hypot(DOOR_W, DOOR_H), t]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </group>
    )
  }

  // Faces +Z (toward the player at spawn). Door panel only — frame is drawn
  // separately by ReturnPortalFrame so the ticker strips can render in front.
  return (
    <mesh position={[0, DOOR_CY, PORTAL_Z]}>
      <planeGeometry args={[DOOR_W, DOOR_H]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  )
}

function ReturnPortalFrame({ tier }: { tier: VisionTier }) {
  const { canvas } = useMemo(() => makeDebugTickerCanvas(), [])
  // The frame is decorative chrome (animated red ticker strips). At
  // degraded tiers it would read as misplaced UI rather than world
  // geometry, so it's hidden until tier 2.
  if (tier < 2) return null
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
      cornerColor="#ffffff"
      mirrorSides
    />
  )
}

// Frisbee-disc spin rate — radians/sec around the disc normal. ~0.015 rad/s
// is roughly one revolution every ~7 minutes: a slow celestial drift.
const GALAXY_SPIN_RAD_PER_SEC = 0.015

export function CarcosaScene({ variation, glimpse }: { variation: Variation; glimpse: boolean }) {
  const galaxyGeo = useMemo(() => makeGalaxyGeometry(), [])
  const skyStarsGeo = useMemo(() => makeSkyStarsGeometry(), [])
  const dustDiscGeo = useMemo(() => makeDustDiscGeometry(), [])
  const dustDomeGeo = useMemo(() => makeDustDomeGeometry(), [])
  const tier1GroundGeo = useMemo(() => makeTier1GroundGeometry(), [])

  // Quaternion that maps local (x, y, z) onto the disc basis (u, v, n) so the
  // spin axis (local z) coincides with the disc normal. Computed once.
  const discQuat = useMemo(() => {
    const { u, v, n } = makeDiscBasis()
    const m = new Matrix4().makeBasis(
      new Vector3(u[0], u[1], u[2]),
      new Vector3(v[0], v[1], v[2]),
      new Vector3(n[0], n[1], n[2]),
    )
    return new Quaternion().setFromRotationMatrix(m)
  }, [])

  const spinRef = useRef<Group>(null!)
  useFrame((_, delta) => {
    if (spinRef.current) spinRef.current.rotation.z += delta * GALAXY_SPIN_RAD_PER_SEC
  })

  // Stored tier (set in credits) is overridden to full for the brief
  // sensor-overload glimpse. The glimpse boolean is owned by MuseumPage
  // so it can synchronize the visor-shutter DOM overlay with the tier
  // swap — see the visor sequence around setActiveScene.
  const storedTier = useVisionTier()
  const tier: VisionTier = glimpse ? 2 : storedTier

  return (
    <>
      {/* Flat lighting; no directional light → no shadows. */}
      <ambientLight intensity={0.9} />

      {/* Tiers 0 and 1 both wrap the player in a black skybox so the world
          reads as a void — the canvas's declarative <color attach="background">
          in MuseumPage is white for Carcosa, so this sphere is what actually
          paints the sky black. renderOrder=-100 + depthWrite=false keeps
          everything else drawing cleanly in front. */}
      {tier !== 2 && (
        <mesh renderOrder={-100}>
          <sphereGeometry args={[3000, 16, 16]} />
          <meshBasicMaterial color="#000000" side={BackSide} toneMapped={false} depthWrite={false} />
        </mesh>
      )}

      {/* Ground.
          - Tier 0: omitted; sensors don't resolve terrain.
          - Tier 1: a red→black gradient wireframe (vertex-coloured plane)
            so the ground feels grounded near the player and dissolves
            into the black skybox at the horizon. wireframeLinewidth
            asks the driver for slightly thicker lines (capped at 1 on
            many WebGL impls but harmless where unsupported).
          - Tier 2: full saturated red plane. */}
      {tier === 1 && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          geometry={tier1GroundGeo}
        >
          <meshBasicMaterial vertexColors wireframe wireframeLinewidth={2} toneMapped={false} />
        </mesh>
      )}
      {tier === 2 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[2000, 2000]} />
          <meshBasicMaterial color="#e8202a" toneMapped={false} />
        </mesh>
      )}

      {/* Sky / dust dome and stars.
          - Tier 0: hidden; the void is empty.
          - Tier 1: white points so they pop against the black skybox.
            Galaxy + dust disc are hidden at tier 1 (one celestial layer
            is enough for the degraded read).
          - Tier 2: black points against the white sky, full galaxy. */}
      {tier !== 0 && (
        <>
          <points geometry={dustDomeGeo} renderOrder={-10}>
            <pointsMaterial color={tier === 1 ? '#ffffff' : '#000000'} size={2} sizeAttenuation toneMapped={false} depthWrite={false} />
          </points>

          <points geometry={skyStarsGeo} renderOrder={-10}>
            <pointsMaterial color={tier === 1 ? '#ffffff' : '#000000'} size={2.5} sizeAttenuation toneMapped={false} depthWrite={false} />
          </points>
        </>
      )}

      {tier === 2 && (
        <group position={GALAXY_OFFSET} quaternion={discQuat}>
          <group ref={spinRef}>
            <points geometry={dustDiscGeo} renderOrder={-10}>
              <pointsMaterial color="#000000" size={2} sizeAttenuation toneMapped={false} depthWrite={false} />
            </points>
            <points geometry={galaxyGeo} renderOrder={-10}>
              <pointsMaterial color="#000000" size={3} sizeAttenuation toneMapped={false} depthWrite={false} />
            </points>
          </group>
        </group>
      )}

      <ReturnPortal tier={tier} />
      <ReturnPortalFrame tier={tier} />

      {/* Variation-bound scan nodes. Each variation declares its own set
          in src/data/variations.ts. */}
      {variation.nodes.map((n) => (
        <Node key={n.id} node={n} tier={tier} />
      ))}
    </>
  )
}

export const returnPortalZone = {
  minX: -0.9,
  maxX: 0.9,
  minZ: -9.8,
  maxZ: -8.9,
}
