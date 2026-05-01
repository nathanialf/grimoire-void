export const ROOM = { w: 24, d: 24, h: 5 }
export const PEDESTAL_SIZE = 1

// One slug per pedestal slot (16 total). null = bare empty pedestal — no
// chip, ticker, or top light. Order matches `pedestalPositions`
// below; reordering this array changes which pedestal a document occupies,
// but the cartridge's appearance is slug-hashed (see hashSlug in data/index)
// so the document's look is stable regardless of slot.
//
// To put a document on a pedestal, add its slug here. To make a document
// ambient (wiki-only, no pedestal), leave it out of this array — being in
// REGISTRY is unrelated to museum presence.
export const MUSEUM_PEDESTALS: (string | null)[] = [
  'aria-vex',
  'pallid-watcher',
  'hollow-blade',
  'yael-mox',
  'greyfield-choir',
  'spectral-caul',
  'outpost-kaya',
  'omicron-collapse',
  'wasting-expanse',
  'sable-threshold',
  'sunken-relay',
  'threshold-accords',
  'glass-litany',
  null,
  null,
  null,
]

// 4×4 floor grid (16 pedestals). Pedestals are inset from every wall and
// offset from the x=0 axis so the entry (+Z) and Carcosa (-Z) doors share
// a clear path. Slots beyond ARTIFACT_NAMES.length render as bare empty
// pedestals — no chip, ticker, or top light.
const PEDESTAL_GRID = [-7.5, -2.5, 2.5, 7.5] as const
export const pedestalPositions: [number, number][] = PEDESTAL_GRID.flatMap(
  (x) => PEDESTAL_GRID.map((z): [number, number] => [x, z]),
)
export const PEDESTAL_COUNT = pedestalPositions.length

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number }

// Exit door on the +Z wall (behind spawn).
const EXIT_Z = ROOM.d / 2 - 0.1
export const exitZone: Rect = {
  minX: -0.9,
  maxX: 0.9,
  minZ: EXIT_Z - 0.8,
  maxZ: EXIT_Z + 0.1,
}
export const EXIT_Z_POS = EXIT_Z

const PLAYER_INSET = 0.5

export const walkableRects: Rect[] = [
  {
    minX: -ROOM.w / 2 + PLAYER_INSET,
    maxX:  ROOM.w / 2 - PLAYER_INSET,
    minZ: -ROOM.d / 2 + PLAYER_INSET,
    maxZ:  ROOM.d / 2 - PLAYER_INSET,
  },
]

function inRect(x: number, z: number, r: Rect): boolean {
  return x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ
}

function anyContains(x: number, z: number, rects: Rect[]): boolean {
  for (const r of rects) if (inRect(x, z, r)) return true
  return false
}

function distToRect(x: number, z: number, r: Rect): number {
  const dx = Math.max(r.minX - x, 0, x - r.maxX)
  const dz = Math.max(r.minZ - z, 0, z - r.maxZ)
  return Math.hypot(dx, dz)
}

function nearestRectDist(x: number, z: number, rects: Rect[]): number {
  let best = Infinity
  for (const r of rects) {
    const d = distToRect(x, z, r)
    if (d < best) best = d
  }
  return best
}

// Axis-separated wall slide: try the full step; if blocked, try x-only then
// z-only. If the player is already outside every rect (e.g. floating-point
// drift on a wall edge), allow whichever move gets closest to a walkable
// rect — never freeze the player in place.
export function clampToWalkable(
  next: { x: number; z: number },
  prev: { x: number; z: number },
  rects: Rect[] = walkableRects,
): { x: number; z: number } {
  if (anyContains(next.x, next.z, rects)) return next
  if (anyContains(next.x, prev.z, rects)) return { x: next.x, z: prev.z }
  if (anyContains(prev.x, next.z, rects)) return { x: prev.x, z: next.z }

  // Recovery: pick the candidate (full / x-only / z-only / stay) that
  // minimizes distance to the nearest rect, so the player can walk back in.
  const candidates = [
    { x: next.x, z: next.z },
    { x: next.x, z: prev.z },
    { x: prev.x, z: next.z },
    { x: prev.x, z: prev.z },
  ]
  let best = candidates[3]
  let bestD = nearestRectDist(best.x, best.z, rects)
  for (let i = 0; i < 3; i++) {
    const d = nearestRectDist(candidates[i].x, candidates[i].z, rects)
    if (d < bestD) {
      bestD = d
      best = candidates[i]
    }
  }
  return best
}

// Carcosa door sits on the -Z wall (z = -ROOM.d/2), directly across the
// museum from the entry door. Trigger zone is the strip just inside the
// wall in front of the door.
const CARCOSA_DOOR_Z_INNER = -ROOM.d / 2 + PLAYER_INSET
export const carcosaDoorZone: Rect = {
  minX: -0.6,
  maxX:  0.6,
  minZ: CARCOSA_DOOR_Z_INNER - 0.1,
  maxZ: CARCOSA_DOOR_Z_INNER + 0.8,
}

// Wall fixtures along the -Z (carcosa-door) wall: variant terminal,
// cartridge dispenser, tool wall-mount. Each fixture is described by the
// center of its front face (xy) and its outer dimensions (w, h, d). The
// back face is flush against the wall at z = -ROOM.d/2.
//
// AABBs derived from these are used as `aim` ray-hit boxes for the
// trigger system — players look at the fixture and press E to interact.
// The terminal is purely visual (no trigger), so its constant only
// drives geometry placement.
export interface WallFixture {
  centerX: number
  centerY: number
  width: number
  height: number
  depth: number
}

const WALL_Z = -ROOM.d / 2

// Variant terminal — wall-mounted, sits on the same wall as the
// carcosa door, just to the left of it.
export const variantTerminalFixture: WallFixture = {
  centerX: -1.6,
  centerY: 1.55,
  width: 0.72,
  height: 0.6,
  depth: 0.09,
}

export interface AABB {
  min: [number, number, number]
  max: [number, number, number]
}

// Convert a wall fixture into an AABB usable by Trigger.aim. Front face
// sits at (z = WALL_Z + depth); back face is flush at WALL_Z.
export function wallFixtureAABB(f: WallFixture): AABB {
  const halfW = f.width / 2
  const halfH = f.height / 2
  return {
    min: [f.centerX - halfW, f.centerY - halfH, WALL_Z],
    max: [f.centerX + halfW, f.centerY + halfH, WALL_Z + f.depth],
  }
}

// Free-standing 3D fixture descriptor, used for things attached to the
// central pedestal pillar (not the room walls).
export interface FixtureBox {
  center: [number, number, number]
  size: [number, number, number]
}

export function fixtureBoxAABB(b: FixtureBox): AABB {
  const [cx, cy, cz] = b.center
  const [w, h, d] = b.size
  return {
    min: [cx - w / 2, cy - h / 2, cz - d / 2],
    max: [cx + w / 2, cy + h / 2, cz + d / 2],
  }
}

// Tool + dispenser are wall-mounted on the +X (east) side wall, side by
// side at chest height. Each fixture's AABB is its world-space bounding
// box; rendering rotates the meshes -π/2 around Y so their original +Z
// front faces become world -X (facing into the room).
export const toolMountFixture: FixtureBox = {
  center: [
    ROOM.w / 2 - 0.07,
    1.05,
    0,
  ],
  size: [0.16, 0.18, 0.4],
}
export const toolMountRotationY = -Math.PI / 2

export const cartDispenserFixture: FixtureBox = {
  center: [
    ROOM.w / 2 - 0.11,
    1.05,
    0.55,
  ],
  size: [0.22, 0.42, 0.5],
}
export const cartDispenserRotationY = -Math.PI / 2

export { WALL_Z }
