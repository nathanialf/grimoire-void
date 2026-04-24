export interface RenderPixelBitmapOptions {
  lines: string[];
  font: string;
  renderSize: number;
  letterSpacing?: number;
  lineHeight?: number;
  align?: 'left' | 'center';
  textTransform?: 'none' | 'uppercase';
  alphaThreshold?: number;
  color?: string;
}

export interface RenderPixelBitmapResult {
  dataUrl: string;
  displayWidth: number;
  displayHeight: number;
}

const cache = new Map<string, RenderPixelBitmapResult>();

export function renderPixelBitmap(
  options: RenderPixelBitmapOptions,
): RenderPixelBitmapResult {
  const key = JSON.stringify(options);
  const cached = cache.get(key);
  if (cached) return cached;

  const {
    lines,
    font,
    renderSize,
    letterSpacing = 0,
    lineHeight = 0.95,
    align = 'center',
    textTransform = 'none',
    alphaThreshold = 80,
    color = '#ffffff',
  } = options;

  const dpr = Math.round(window.devicePixelRatio || 1);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;

  if (letterSpacing) {
    ctx.letterSpacing = `${letterSpacing}px`;
  }

  const transformed =
    textTransform === 'uppercase' ? lines.map((l) => l.toUpperCase()) : lines;
  const lineMetrics = transformed.map((line) => ctx.measureText(line));
  const maxWidth = Math.ceil(
    Math.max(...lineMetrics.map((m) => m.width)),
  );
  const rowHeight = renderSize * lineHeight;
  // generous height — we'll auto-crop after rendering
  const totalHeight = Math.ceil(rowHeight * lines.length + renderSize);

  const cssW = maxWidth + 2;
  const cssH = totalHeight;

  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;

  ctx.scale(dpr, dpr);

  // Re-set font after resize clears state
  ctx.font = font;
  if (letterSpacing) {
    ctx.letterSpacing = `${letterSpacing}px`;
  }
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;

  transformed.forEach((line, i) => {
    const m = lineMetrics[i];
    let x = 0;
    if (align === 'center') {
      x = (cssW - m.width) / 2;
    }
    ctx.fillText(line, x, i * rowHeight);
  });

  // Threshold alpha — pure 1-bit mask
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    data[i] = data[i] > alphaThreshold ? 255 : 0;
  }
  ctx.putImageData(imageData, 0, 0);

  // Auto-crop: find tight vertical bounds of non-transparent pixels
  const w = canvas.width;
  const h = canvas.height;
  let topRow = 0;
  let bottomRow = h - 1;

  findTop: for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        topRow = y;
        break findTop;
      }
    }
  }

  findBottom: for (let y = h - 1; y >= 0; y--) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        bottomRow = y;
        break findBottom;
      }
    }
  }

  // 1px padding around tight bounds
  topRow = Math.max(0, topRow - dpr);
  bottomRow = Math.min(h - 1, bottomRow + dpr);
  const croppedH = bottomRow - topRow + 1;

  // Create cropped canvas
  const cropped = document.createElement('canvas');
  cropped.width = w;
  cropped.height = croppedH;
  const cCtx = cropped.getContext('2d')!;
  cCtx.drawImage(canvas, 0, topRow, w, croppedH, 0, 0, w, croppedH);

  const result: RenderPixelBitmapResult = {
    dataUrl: cropped.toDataURL('image/png'),
    displayWidth: cssW,
    displayHeight: croppedH / dpr,
  };

  cache.set(key, result);
  return result;
}
