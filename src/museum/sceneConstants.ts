export const ROOM = { w: 12, d: 12, h: 4 }
export const PEDESTAL_COUNT = 10
export const PEDESTAL_SIZE = 1

// Artifact names — one per pedestal, drawn from the existing Grimoire
// document set (characters, bestiary, items, locations, lore, maps, reports).
export const ARTIFACT_NAMES = [
  'ARIA VEX',
  'THE PALLID WATCHER',
  'THE HOLLOW BLADE',
  'YAEL MOX',
  'THE GREYFIELD CHOIR',
  'THE SPECTRAL CAUL',
  'OUTPOST KAYA',
  'THE OMICRON COLLAPSE',
  'THE WASTING EXPANSE',
  'OPERATION SABLE THRESHOLD',
]

// Pedestals line the walls plus sit in each corner of the room.
const PEDESTAL_WALL_INSET = ROOM.w / 2 - PEDESTAL_SIZE / 2  // 5.5
export const pedestalPositions: [number, number][] = [
  [ 2, -PEDESTAL_WALL_INSET],
  [-2, -PEDESTAL_WALL_INSET],
  [ PEDESTAL_WALL_INSET, -2],
  [ PEDESTAL_WALL_INSET,  2],
  [ 1.5, 0],
  [-1.5, 0],
  [ PEDESTAL_WALL_INSET,  PEDESTAL_WALL_INSET],
  [ PEDESTAL_WALL_INSET, -PEDESTAL_WALL_INSET],
  [-PEDESTAL_WALL_INSET, -PEDESTAL_WALL_INSET],
  [-PEDESTAL_WALL_INSET,  PEDESTAL_WALL_INSET],
]

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number }

// Exit door on the +Z wall (behind spawn at z=5).
const EXIT_Z = ROOM.d / 2 - 0.1
export const exitZone: Rect = {
  minX: -0.9,
  maxX: 0.9,
  minZ: EXIT_Z - 0.8,
  maxZ: EXIT_Z + 0.1,
}
export const EXIT_Z_POS = EXIT_Z

const PLAYER_INSET = 0.5

// Walkable rects (player position must be inside at least one). Just the
// museum interior — the antechamber + corridor were collapsed into a single
// portal door cut into the museum's -X wall.
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

// Carcosa door now sits on the museum's -X wall (x = -ROOM.w/2). Trigger zone
// is the strip just inside the wall in front of the door.
const CARCOSA_DOOR_X_INNER = -ROOM.w / 2 + PLAYER_INSET // -5.5
export const carcosaDoorZone: Rect = {
  minX: CARCOSA_DOOR_X_INNER,
  maxX: CARCOSA_DOOR_X_INNER + 0.8,
  minZ: -0.6,
  maxZ:  0.6,
}
