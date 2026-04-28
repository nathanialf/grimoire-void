// Terminal log content. Two phases:
//   1. bootSequence — a fixed, deterministic list of boot lines emitted once
//      when the terminal mounts.
//   2. idleStatus — sprinkles after boot, drawn from a wider corpus to keep
//      repeats infrequent.

const TOTAL_CARTS = 13

export function bootSequence(): string[] {
  return [
    'BOOT cohesion field nominal',
    'BOOT mount /var/grimoire',
    'BOOT resolve module:./sensor.thermal ok',
    'BOOT resolve module:./sensor.psi ok',
    'BOOT resolve module:./sensor.optical ok',
    'BOOT resolve module:./sensor.aux ok',
    'BOOT init pass:effectComposer',
    'BOOT bind uniform:pixelSort',
    'BOOT bind uniform:datamosh',
    'BOOT bind uniform:camMotion',
    'BOOT bind uniform:prevBuffer',
    'BOOT load shader:halation',
    'BOOT load shader:toneMap',
    'BOOT load shader:pixelSort',
    'BOOT load shader:datamosh',
    'BOOT load shader:caBlowout',
    'BOOT mount scene:museum',
    `BOOT cart inventory  0 / ${TOTAL_CARTS} canonized`,
    `BOOT cart inventory  0 / ${TOTAL_CARTS} partial`,
    'BOOT render target  1920 x 1080  init',
    'BOOT gpu pipeline ready',
    'BOOT integrity check ok',
    'BOOT field cohesion 0.97',
    'BOOT psi baseline ok',
    'BOOT ready',
  ]
}

const ARTIFACTS = [
  'pedestal_01', 'pedestal_02', 'pedestal_03', 'pedestal_04',
  'pedestal_05', 'pedestal_06', 'pedestal_07', 'pedestal_08',
  'pedestal_09', 'pedestal_10', 'pedestal_11', 'pedestal_12',
  'pedestal_13', 'pedestal_aux',
]
const SUBSYS = [
  'sensor.thermal', 'sensor.psi', 'sensor.optical', 'sensor.aux',
  'sensor.kinetic', 'cohesion.local', 'cohesion.field',
  'integrity.field', 'integrity.frame', 'paramount.tier',
  'attune.bias', 'fieldwork.handoff', 'graviton.lattice',
]
const SHADERS = [
  'pixelSort', 'datamosh', 'halation', 'toneMap', 'caBlowout',
  'grainChroma', 'dither', 'scanlines', 'barrel', 'colorGrade',
]
const SCENES = [
  'museum', 'museum.foyer', 'museum.archive_a', 'museum.archive_b',
  'carcosa.var.001', 'carcosa.var.002', 'carcosa.var.003',
  'carcosa.transit', 'carcosa.spire',
]
const CRYPTIC_TAGS = [
  '[REDACTED]', '████', '◌◌◌◌', '∅∅∅', 'EXPUNGED',
  '⟨witheld⟩', 'NIHIL', '░░░░',
]
const CRYPTIC_VERBS = [
  'handshake … timeout', 'nominal', 'cohesion past threshold',
  'integrity uncertain', 'echo ghost detected', 'resync deferred',
  'witness lost', 'attestation failed', 'ledger split',
]
const HEX_TABLE = '0123456789abcdef'

function pick<T>(arr: T[]): T {
  return arr[(Math.random() * arr.length) | 0]
}
function maybe(p: number): boolean {
  return Math.random() < p
}
function range(min: number, max: number, digits = 0): string {
  return (min + Math.random() * (max - min)).toFixed(digits)
}
function hex(n: number): string {
  let s = ''
  for (let i = 0; i < n; i++) s += HEX_TABLE[(Math.random() * 16) | 0]
  return s
}

const GENERATORS: { fn: () => string; w: number }[] = [
  { w: 6, fn: () => `cart inventory  ${(Math.random() * 4) | 0} / ${TOTAL_CARTS} canonized` },
  { w: 5, fn: () => `cart inventory  ${(Math.random() * 5) | 0} / ${TOTAL_CARTS} partial` },
  { w: 7, fn: () => `rendering artifact: ${pick(ARTIFACTS)}` },
  { w: 4, fn: () => `streaming asset: ${pick(ARTIFACTS)}.${pick(['mesh', 'tex', 'mat', 'lod'])}` },
  { w: 5, fn: () => `${pick(SUBSYS)} = nominal` },
  { w: 3, fn: () => `${pick(SUBSYS)} = degraded ±${range(0.04, 0.18, 3)}` },
  { w: 3, fn: () => `${pick(SUBSYS)} drift ${range(-0.04, 0.04, 3)}` },
  { w: 6, fn: () => `frame ${range(13.0, 22.5, 1)} ms` },
  { w: 3, fn: () => `gpu.pct = ${range(18, 84, 0)}` },
  { w: 4, fn: () => `mem.gpu = ${range(320, 720, 0)}M / 2048M` },
  { w: 3, fn: () => `mem.heap = ${range(78, 198, 0)}M / 512M` },
  { w: 4, fn: () => `psi baseline ok  ±${range(0, 0.04, 3)}` },
  { w: 3, fn: () => `cohesion field ${range(0.82, 0.99, 2)}` },
  { w: 3, fn: () => `field anchor: pedestal_${(Math.random() * 13 | 0) + 1} held` },
  { w: 3, fn: () => `update ${pick(SHADERS)} = ${range(0, 1, 3)}` },
  { w: 3, fn: () => `bind uniform:${pick(['ramp', 'time', 'camMotion', 'prevBuffer'])} ok` },
  { w: 3, fn: () => `tick @ ${range(2, 9999, 2)}s` },
  { w: 3, fn: () => `cam Δyaw ${range(-0.08, 0.08, 3)}` },
  { w: 3, fn: () => `cam Δpitch ${range(-0.04, 0.04, 3)}` },
  { w: 3, fn: () => `raycast → ${pick(ARTIFACTS)} d=${range(1.0, 6.0, 2)}` },
  { w: 2, fn: () => `scene ready: ${pick(SCENES)}` },
  { w: 2, fn: () => `lod swap ${pick(ARTIFACTS)} ${pick(['→ 0', '→ 1', '→ 2'])}` },
  { w: 2, fn: () => `texture cache ${(Math.random() * 100) | 0}% warm` },
  { w: 3, fn: () => `${hex(2)}.${hex(2)}.${hex(4)} queue ok` },
  { w: 3, fn: () => `${hex(4)}-${hex(4)} ${pick(['stalled', 'orphan', 'shadowed', 'replayed'])}` },
  { w: 4, fn: () => `${pick(CRYPTIC_TAGS)} ${pick(CRYPTIC_VERBS)}` },
  { w: 2, fn: () => `// ${pick(CRYPTIC_TAGS)}` },
  { w: 2, fn: () => `audit log line ${(Math.random() * 99999) | 0 | 0} ${maybe(0.4) ? 'ok' : 'pending'}` },
  { w: 2, fn: () => `paramount tier ${pick(['I', 'II', 'III', 'IV'])} ${pick(['stable', 'observing', 'silent'])}` },
  { w: 2, fn: () => `cohesion variance σ = ${range(0.001, 0.012, 4)}` },
  { w: 2, fn: () => `psi ${pick(['low', 'lull', 'spike'])} ${range(0, 0.06, 3)}` },
  { w: 2, fn: () => `subprocess ${hex(3)} → ${pick(['heartbeat', 'idle', 'spawn', 'reaped'])}` },
  { w: 2, fn: () => `crc ${hex(8)} match` },
  { w: 1, fn: () => `crc ${hex(8)} mismatch` },
  { w: 2, fn: () => `compositor flush  ${(Math.random() * 60 | 0)}` },
  { w: 1, fn: () => `vector field warp ${range(0, 0.04, 3)}` },
]
const TOTAL_W = GENERATORS.reduce((s, g) => s + g.w, 0)

export function idleStatus(): string {
  let r = Math.random() * TOTAL_W
  for (const g of GENERATORS) {
    r -= g.w
    if (r <= 0) return g.fn()
  }
  return GENERATORS[0].fn()
}
