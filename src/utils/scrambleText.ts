// Deterministic length-matched scramble generator. Mirrors the
// FILL-and-FRAGMENTS noise mix that `RedactedPage` uses for the
// access-denied view so wiki redactions read in the same visual
// register — but seeded so re-renders produce stable output instead of
// reshuffling each frame. Shape parity with the original content is
// the point: replacing a 240-character paragraph with 240 characters
// of scramble preserves the document's visual silhouette while
// obliterating the text.

const FILL = '█▓░▒╳◼·:'

const FRAGMENTS = [
  '██████', '▓▓▓▓▓', '░░░░░', '▒▒▒▒▒', '◼◼◼◼◼',
  'DANGER', 'HAZARD', 'LETHAL', 'ABORT', 'FATAL', 'BREACH', 'CRITICAL',
  'VOID-7', 'VOID-9', 'BLACK SIGNAL', 'NULL ORIGIN', 'DEAD ZONE',
  'COGNITOHAZARD', 'MEMETIC KILL AGENT', 'INFOHAZARD',
  'EXPUNGE', 'REDACT', 'PURGE', 'DENY', 'CONTAIN', 'NEUTRALIZE',
  'SECTOR-0', 'SITE-NULL', 'ZONE ALPHA', 'DEEP ARCHIVE', 'SUBLEVEL-X',
  '||||||||||||', '|||:|:|:||:', '|:|:|:|:|:|', '::||::||::||',
  '0xDEAD', '0xBEEF', '0xFFFF', '0x0000', '0xBAD1', '0xNULL',
  'ERR_STACK_OVERFLOW', 'SEGFAULT', 'KERNEL_PANIC', 'BUS_ERROR',
  'SIGNAL_LOST', 'CARRIER_ABSENT', 'LINK_SEVERED', 'HEARTBEAT_FLAT',
  'BIOHAZARD', 'RADIOLOGICAL', 'THERMONUCLEAR', 'ANTIMATTER',
  'SUBJECT EXPIRED', 'NO SURVIVORS', 'ALL HANDS LOST', 'TOTAL LOSS',
  'DO NOT OPEN', 'DO NOT READ', 'LOOK AWAY', 'EYES ONLY',
  'PATTERN SCREAMER', 'THAUMIEL', 'APOLLYON', 'ARCHON',
  'TISSUE SAMPLE ██', 'SPECIMEN ████', 'REMAINS: PARTIAL',
  'LAT:██.████', 'LON:-███.██', 'DEPTH:████m', 'TEMP:████K',
  'CLEARANCE REVOKED', 'ACCESS TERMINATED', 'SESSION KILLED',
  '▸▸▸▸▸▸▸▸', '◂◂◂◂◂◂◂◂', '▴▴▴▴▴▴▴▴', '▾▾▾▾▾▾▾▾',
  'LAST TRANSMISSION:', 'FINAL LOG:', 'TERMINAL OUTPUT:',
  '..........', '----------', '//////////', '\\\\\\\\\\\\',
  'CHECKSUM FAILED', 'INTEGRITY: 0%', 'CORRUPTION: 100%',
  'NODE UNREACHABLE', 'TTL EXCEEDED', 'ROUTE BLACKHOLED',
  'BARCODE:||:|:|::|||:', 'SCAN:|||::||:|:|:||',
  '[DATA EXPUNGED]', '[REDACTED]', '[CLASSIFIED]', '[REMOVED]',
  'REF#████-████', 'CASE#██-████', 'TAG#████████',
]

function hash2(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263 + 1274126177) | 0
  h = ((h ^ (h >> 13)) * 1103515245) | 0
  return ((h & 0x7fffffff) / 0x7fffffff)
}

function smoothNoise(x: number, y: number, scale: number): number {
  const sx = x / scale
  const sy = y / scale
  const ix = Math.floor(sx)
  const iy = Math.floor(sy)
  const fx = sx - ix
  const fy = sy - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash2(ix, iy)
  const b = hash2(ix + 1, iy)
  const c = hash2(ix, iy + 1)
  const d = hash2(ix + 1, iy + 1)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

function density(col: number, row: number): number {
  return smoothNoise(col, row, 12) * 0.6 + smoothNoise(col, row, 5) * 0.4
}

function makeRng(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0
  if (s === 0) s = 0x9e3779b9
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

// FNV-1a-flavoured hash for deriving stable seeds from an
// arbitrary list of identifying parts (field name, indices, etc.).
// Used so each redacted position in a doc gets its own deterministic
// scramble pattern without re-using the same seed everywhere.
export function seedFor(...parts: Array<string | number>): number {
  let h = 0x811c9dc5
  for (const p of parts) {
    const s = String(p)
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 0x01000193)
    }
    // Separator so seedFor('a', 'b') ≠ seedFor('ab').
    h ^= 0x9e3779b9
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// Marker prepended to every non-empty scramble output. `renderText`
// detects this leading character, strips it, and wraps the remaining
// text in the `.redact` class (red) so the player reads scrambled
// runs as redaction noise rather than authored content. U+200B is a
// zero-width space — printed length stays equal to the requested
// `length`, only the JS string length grows by 1.
export const REDACT_MARKER = '​'

// Generates `length` characters of access-denied-style scramble text,
// deterministic for the given (length, seed) pair. Mixes blank runs,
// FILL block characters, and clipped FRAGMENTS phrases at varying
// densities driven by smoothNoise — same mix as RedactedPage's full-
// screen field, just length-bounded. The output is prefixed with
// REDACT_MARKER so downstream renderers can class the result red. An
// empty input length returns the empty string (no marker) so callers
// can pass through naturally for empty fields.
export function scrambleText(length: number, seed: number = 0): string {
  if (length <= 0) return ''
  const rand = makeRng(seed)
  const row = seed & 0xffff
  let line = ''
  let col = 0
  while (col < length) {
    const d = density(col, row)
    if (d < 0.25) {
      const run = 2 + Math.floor(rand() * 6)
      for (let i = 0; i < run && col < length; i++, col++) {
        line += rand() < 0.08 ? FILL[Math.floor(rand() * FILL.length)] : ' '
      }
    } else if (d < 0.5) {
      if (rand() < 0.15) {
        const frag = FRAGMENTS[Math.floor(rand() * FRAGMENTS.length)]
        const slice = frag.slice(0, length - col)
        line += slice
        col += slice.length
      } else {
        line += rand() < 0.35 ? FILL[Math.floor(rand() * FILL.length)] : ' '
        col++
      }
    } else if (d < 0.75) {
      if (rand() < 0.3) {
        const frag = FRAGMENTS[Math.floor(rand() * FRAGMENTS.length)]
        const slice = frag.slice(0, length - col)
        line += slice
        col += slice.length
      } else {
        line += FILL[Math.floor(rand() * FILL.length)]
        col++
      }
    } else {
      if (rand() < 0.25) {
        const frag = FRAGMENTS[Math.floor(rand() * FRAGMENTS.length)]
        const slice = frag.slice(0, length - col)
        line += slice
        col += slice.length
      } else {
        const run = 1 + Math.floor(rand() * 4)
        for (let i = 0; i < run && col < length; i++, col++) {
          line += FILL[Math.floor(rand() * FILL.length)]
        }
      }
    }
  }
  return REDACT_MARKER + line.slice(0, length)
}
