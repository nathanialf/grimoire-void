export const ROOM = { w: 24, d: 24, h: 5 }
export const PEDESTAL_SIZE = 1

// One slug per pedestal slot (16 total). null = bare empty pedestal — no
// chip, voxels, ticker, or top light. Order matches `pedestalPositions`
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
// pedestals — no chip, voxels, ticker, or top light.
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
