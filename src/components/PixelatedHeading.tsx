import { useEffect, useState } from 'react';
import { renderPixelBitmap, type RenderPixelBitmapResult } from '../utils/renderPixelBitmap';
import styles from '../styles/PixelatedHeading.module.css';

interface PixelatedHeadingProps {
  lines: string[];
  renderSize?: number;
  scale?: number;
  fontWeight?: number;
  color?: string;
  align?: 'center' | 'left';
  letterSpacing?: number;
  lineHeight?: number;
  fontStyle?: 'normal' | 'italic';
  textTransform?: 'none' | 'uppercase';
  alphaThreshold?: number;
  className?: string;
  caStrength?: 'soft' | 'default' | 'strong';
}

const CA_CLASS: Record<NonNullable<PixelatedHeadingProps['caStrength']>, string> = {
  soft: 'ca-fx-soft',
  default: 'ca-fx',
  strong: 'ca-fx-strong',
}

export function PixelatedHeading({
  lines,
  renderSize = 18,
  scale = 4,
  fontWeight = 900,
  color,
  align = 'center',
  letterSpacing = 0,
  lineHeight = 0.95,
  fontStyle = 'normal',
  textTransform = 'none',
  alphaThreshold = 80,
  className,
  caStrength = 'strong',
}: PixelatedHeadingProps) {
  const [result, setResult] = useState<RenderPixelBitmapResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled) return;

      const resolvedColor =
        color ||
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-text-bright')
          .trim() ||
        '#e8e8e8';

      const font = `${fontStyle} ${fontWeight} ${renderSize}px 'Playfair Display', Georgia, serif`;
      const res = renderPixelBitmap({
        lines,
        font,
        renderSize,
        letterSpacing,
        lineHeight,
        align,
        textTransform,
        alphaThreshold,
        color: resolvedColor,
      });

      setResult(res);
    });

    return () => {
      cancelled = true;
    };
  }, [lines, renderSize, scale, fontWeight, color, align, letterSpacing, lineHeight, fontStyle, textTransform, alphaThreshold]);

  return (
    <div
      className={`${styles.wrapper} ${CA_CLASS[caStrength]} ${className || ''}`}
      aria-hidden="true"
      style={align === 'center' ? { textAlign: 'center' } : undefined}
    >
      {result ? (
        <img
          src={result.dataUrl}
          className={styles.canvas}
          width={result.displayWidth * scale}
          height={result.displayHeight * scale}
          alt=""
          draggable={false}
        />
      ) : null}
    </div>
  );
}
