export const ROOM = { w: 12, d: 12, h: 4 }
export const PEDESTAL_COUNT = 6
export const PEDESTAL_RING_R = 3
export const PEDESTAL_SIZE = 1

// Stub artifact names drawn from the Grimoire documents (2 characters, 2
// bestiary, 2 items) — one per pedestal.
export const ARTIFACT_NAMES = [
  'ARIA VEX',
  'THE PALLID WATCHER',
  'THE HOLLOW BLADE',
  'YAEL MOX',
  'THE GREYFIELD CHOIR',
  'THE SPECTRAL CAUL',
]

export const pedestalPositions: [number, number][] = Array.from({ length: PEDESTAL_COUNT }, (_, i) => {
  const a = (i / PEDESTAL_COUNT) * Math.PI * 2
  return [Math.cos(a) * PEDESTAL_RING_R, Math.sin(a) * PEDESTAL_RING_R]
})

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

// ============================================================================
// Antechamber + corridor (debug door area off the museum's -X wall)
// ============================================================================

export const CORRIDOR = { len: 4, w: 2.4, h: 3.2 }
export const ANTECHAMBER = { w: 6, d: 6, h: 3.6 }
export const DOORWAY = { w: 1.5, h: 2.5 }

// Geometry anchors. Museum -X wall sits at x = -6; corridor extends -X from
// there; antechamber sits beyond the corridor.
export const CORRIDOR_X_INNER = -ROOM.w / 2                    // -6
export const CORRIDOR_X_OUTER = CORRIDOR_X_INNER - CORRIDOR.len // -10
export const ANTECHAMBER_CENTER_X = CORRIDOR_X_OUTER - ANTECHAMBER.w / 2 // -13
export const ANTECHAMBER_DOOR_X = ANTECHAMBER_CENTER_X - ANTECHAMBER.w / 2 // -16

const PLAYER_INSET = 0.5

// Walkable rects (player position must be inside at least one). Adjacent rects
// overlap by PLAYER_INSET at doorways so the player can walk through openings
// without getting wedged on the seam.
export const walkableRects: Rect[] = [
  // Museum interior
  {
    minX: -ROOM.w / 2 + PLAYER_INSET,
    maxX:  ROOM.w / 2 - PLAYER_INSET,
    minZ: -ROOM.d / 2 + PLAYER_INSET,
    maxZ:  ROOM.d / 2 - PLAYER_INSET,
  },
  // Corridor — extends into both museum and antechamber walkable insets.
  {
    minX: CORRIDOR_X_OUTER - PLAYER_INSET,
    maxX: CORRIDOR_X_INNER + PLAYER_INSET,
    minZ: -CORRIDOR.w / 2 + 0.3,
    maxZ:  CORRIDOR.w / 2 - 0.3,
  },
  // Antechamber interior
  {
    minX: ANTECHAMBER_CENTER_X - ANTECHAMBER.w / 2 + PLAYER_INSET,
    maxX: ANTECHAMBER_CENTER_X + ANTECHAMBER.w / 2 - PLAYER_INSET,
    minZ: -ANTECHAMBER.d / 2 + PLAYER_INSET,
    maxZ:  ANTECHAMBER.d / 2 - PLAYER_INSET,
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

// Debug door sits on the antechamber's -X wall (x = ANTECHAMBER_DOOR_X).
// Trigger fires when the player is inside this rect, mirroring exitZone.
export const carcosaDoorZone: Rect = {
  minX: ANTECHAMBER_DOOR_X + PLAYER_INSET - 0.1,
  maxX: ANTECHAMBER_DOOR_X + PLAYER_INSET + 0.7,
  minZ: -0.9,
  maxZ:  0.9,
}
