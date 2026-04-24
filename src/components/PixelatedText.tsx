import { useEffect, useState, type ElementType } from 'react';
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
  as: Tag = 'span' as ElementType,
  className,
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

  return (
    <Tag
      className={`${styles.mask} ${className || ''}`}
      aria-hidden="true"
      style={{
        width: w,
        maxWidth: '100%',
        aspectRatio: `${w} / ${h}`,
        maskImage: `url(${result.dataUrl})`,
        WebkitMaskImage: `url(${result.dataUrl})`,
      }}
    />
  );
}
