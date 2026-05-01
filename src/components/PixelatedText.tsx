import { useEffect, useState } from 'react';
import { renderPixelBitmap, type RenderPixelBitmapResult } from '../utils/renderPixelBitmap';
import styles from '../styles/PixelatedText.module.css';

interface PixelatedTextProps {
  children: string;
  renderSize?: number;
  scale?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: 'none' | 'uppercase';
  alphaThreshold?: number;
  fontWeight?: number;
  align?: 'left' | 'center';
  as?: 'span' | 'div';
  className?: string;
  caStrength?: 'soft' | 'default' | 'strong';
}

const CA_CLASS: Record<NonNullable<PixelatedTextProps['caStrength']>, string> = {
  soft: 'ca-fx-soft',
  default: 'ca-fx',
  strong: 'ca-fx-strong',
}

export function PixelatedText({
  children,
  renderSize = 8,
  scale = 2,
  letterSpacing,
  lineHeight = 1.1,
  textTransform = 'none',
  alphaThreshold = 40,
  fontWeight = 400,
  align = 'left',
  as: Tag = 'span',
  className,
  caStrength = 'soft',
}: PixelatedTextProps) {
  const [result, setResult] = useState<RenderPixelBitmapResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled) return;

      const font = `${fontWeight} ${renderSize}px 'JetBrains Mono', monospace`;
      const res = renderPixelBitmap({
        lines: [children],
        font,
        renderSize,
        letterSpacing,
        lineHeight,
        align,
        textTransform,
        alphaThreshold,
        color: '#ffffff',
      });

      setResult(res);
    });

    return () => { cancelled = true; };
  }, [children, renderSize, scale, letterSpacing, lineHeight, textTransform, alphaThreshold, fontWeight, align]);

  if (!result) return null;

  const w = result.displayWidth * scale;
  const h = result.displayHeight * scale;

  // The chromatic aberration filter must live on an OUTER wrapper, not on
  // the masked element itself — `filter` is applied before `mask-image`, so
  // putting both on the same node splits a uniform color rectangle (no
  // internal fringes) before the mask clips it to the text shape, losing
  // the CA. By nesting the masked span inside a ca-fx wrapper, the wrapper
  // renders the masked text first, then the filter splits the visible
  // text-shape edges.
  return (
    <Tag
      className={`${styles.wrap} ${CA_CLASS[caStrength]} ${className || ''}`}
      aria-hidden="true"
      style={{
        width: w,
        maxWidth: '100%',
        aspectRatio: `${w} / ${h}`,
      }}
    >
      <span
        className={styles.mask}
        style={{
          maskImage: `url(${result.dataUrl})`,
          WebkitMaskImage: `url(${result.dataUrl})`,
        }}
      />
    </Tag>
  );
}
