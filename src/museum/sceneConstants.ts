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

export const roomBounds = {
  minX: -ROOM.w / 2,
  maxX: ROOM.w / 2,
  minZ: -ROOM.d / 2,
  maxZ: ROOM.d / 2,
}

// Exit door on the +Z wall (behind spawn at z=5).
const EXIT_Z = ROOM.d / 2 - 0.1
export const exitZone = {
  minX: -0.9,
  maxX: 0.9,
  minZ: EXIT_Z - 0.8,
  maxZ: EXIT_Z + 0.1,
}

export const EXIT_Z_POS = EXIT_Z
