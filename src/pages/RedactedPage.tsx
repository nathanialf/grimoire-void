import { useMemo } from 'react';
import { PageFrame } from '../components/PageFrame';
import { useNavigate } from '../hooks/useNavigate';
import styles from '../styles/RedactedPage.module.css';

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
];

const FILL = '█▓░▒╳◼·:';
const SP = ' ';

// Block-letter font — each char is 5 lines tall
const BLOCK_FONT: Record<string, string[]> = {
  'A': ['  ██  ', ' █  █ ', ' ████ ', ' █  █ ', ' █  █ '],
  'C': [' ████ ', ' █    ', ' █    ', ' █    ', ' ████ '],
  'D': [' ███  ', ' █  █ ', ' █  █ ', ' █  █ ', ' ███  '],
  'E': [' ████ ', ' █    ', ' ███  ', ' █    ', ' ████ '],
  'I': [' ███ ', '  █  ', '  █  ', '  █  ', ' ███ '],
  'N': [' █  █ ', ' ██ █ ', ' █ ██ ', ' █  █ ', ' █  █ '],
  'S': [' ████ ', ' █    ', ' ████ ', '    █ ', ' ████ '],
  '/': ['    █ ', '   █  ', '  █   ', ' █    ', '█     '],
  ' ': ['    ', '    ', '    ', '    ', '    '],
};

const BANNER_TEXT = '// ACCESS DENIED //';
const BANNER_HEIGHT = 5;

function buildBanner(): string[] {
  const charLines: string[][] = [];
  for (const ch of BANNER_TEXT) {
    const glyph = BLOCK_FONT[ch];
    if (glyph) charLines.push(glyph);
  }
  const rawLines: string[] = [];
  for (let row = 0; row < BANNER_HEIGHT; row++) {
    rawLines.push(charLines.map(g => g[row]).join(''));
  }
  return rawLines;
}

// Plain-text fallback banner for narrow screens (3 lines tall using simple box)
function buildSmallBanner(): string[] {
  const msg = '// ACCESS DENIED //';
  const border = '═'.repeat(msg.length + 4);
  return [border, '║ ' + msg + ' ║', border];
}

const SUB_MESSAGES = [
  '',
  'CLEARANCE: VOID-7 REQUIRED',
  'FILE ████████ ████████████',
  '',
  '[ RETURN TO INDEX ]',
];

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263 + 1274126177) | 0;
  h = ((h ^ (h >> 13)) * 1103515245) | 0;
  return ((h & 0x7fffffff) / 0x7fffffff);
}

function smoothNoise(x: number, y: number, scale: number): number {
  const sx = x / scale;
  const sy = y / scale;
  const ix = Math.floor(sx);
  const iy = Math.floor(sy);
  const fx = sx - ix;
  const fy = sy - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function density(col: number, row: number): number {
  return smoothNoise(col, row, 12) * 0.6 + smoothNoise(col, row, 5) * 0.4;
}

function generateNoiseLine(row: number, cols: number): string {
  let line = '';
  let col = 0;
  while (col < cols) {
    const d = density(col, row);
    if (d < 0.25) {
      const run = 2 + Math.floor(Math.random() * 6);
      for (let i = 0; i < run && col < cols; i++, col++) {
        line += Math.random() < 0.08
          ? FILL[Math.floor(Math.random() * FILL.length)]
          : SP;
      }
    } else if (d < 0.5) {
      if (Math.random() < 0.15) {
        const frag = FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)];
        const slice = frag.slice(0, cols - col);
        line += slice;
        col += slice.length;
      } else {
        line += Math.random() < 0.35
          ? FILL[Math.floor(Math.random() * FILL.length)]
          : SP;
        col++;
      }
    } else if (d < 0.75) {
      if (Math.random() < 0.3) {
        const frag = FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)];
        const slice = frag.slice(0, cols - col);
        line += slice;
        col += slice.length;
      } else {
        line += FILL[Math.floor(Math.random() * FILL.length)];
        col++;
      }
    } else {
      if (Math.random() < 0.25) {
        const frag = FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)];
        const slice = frag.slice(0, cols - col);
        line += slice;
        col += slice.length;
      } else {
        const run = 1 + Math.floor(Math.random() * 4);
        for (let i = 0; i < run && col < cols; i++, col++) {
          line += FILL[Math.floor(Math.random() * FILL.length)];
        }
      }
    }
  }
  return line.slice(0, cols);
}

interface Segment { text: string; kind: 'noise' | 'banner' | 'sub' | 'link' }

function generateField(cols: number, viewCols: number, rows: number): Segment[] {

  // Use block font if banner fits, otherwise small text banner
  const bannerRaw = buildBanner();
  const useBig = viewCols >= 110;
  const bannerLines = useBig ? bannerRaw : buildSmallBanner();
  const bannerH = bannerLines.length;

  const totalCenter = bannerH + SUB_MESSAGES.length;
  const centerStart = Math.floor((rows - totalCenter) / 2);

  const segments: Segment[] = [];

  for (let r = 0; r < rows; r++) {
    if (r > 0) segments.push({ text: '\n', kind: 'noise' });

    const idx = r - centerStart;
    if (idx >= 0 && idx < bannerH) {
      segments.push({ text: bannerLines[idx], kind: 'banner' });
    } else if (idx >= bannerH && idx < totalCenter) {
      const subIdx = idx - bannerH;
      const msg = SUB_MESSAGES[subIdx];
      if (msg === '') {
        segments.push({ text: generateNoiseLine(r, cols), kind: 'noise' });
      } else if (msg === '[ RETURN TO INDEX ]') {
        segments.push({ text: msg, kind: 'link' });
      } else {
        segments.push({ text: msg, kind: 'sub' });
      }
    } else {
      segments.push({ text: generateNoiseLine(r, cols), kind: 'noise' });
    }
  }

  return segments;
}

export function RedactedPage() {
  const navigate = useNavigate();
  // font-size is 0.55rem; 1ch ≈ 0.6em in monospace, so char width ≈ 0.55 * 0.6 * rootFontSize
  // Over-generate columns — overflow:hidden clips the excess, centering stays accurate
  const segments = useMemo(() => {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const chPx = rootFontSize * 0.55 * 0.6;
    const linePx = rootFontSize * 0.55 * 1.1;
    const viewCols = Math.max(60, Math.floor(window.innerWidth / chPx));
    const cols = Math.max(viewCols, Math.ceil(window.innerWidth / 4));
    const rows = Math.max(100, Math.ceil(window.innerHeight / linePx) + 5);
    return generateField(cols, viewCols, rows);
  }, []);

  return (
    <PageFrame locked>
      <div className={styles.page}>
        <pre className={`${styles.noiseField} ca-fx`}>
          {segments.map((seg, i) => {
            switch (seg.kind) {
              case 'banner':
                return <span key={i} className={styles.banner}>{seg.text}</span>;
              case 'sub':
                return <span key={i} className={styles.sub}>{seg.text}</span>;
              case 'link':
                return (
                  <a
                    key={i}
                    href="/cover"
                    className={styles.returnLink}
                    onClick={(e) => { e.preventDefault(); navigate('/cover'); }}
                  >
                    {seg.text}
                  </a>
                );
              default:
                return <span key={i}>{seg.text}</span>;
            }
          })}
        </pre>
      </div>
    </PageFrame>
  );
}
