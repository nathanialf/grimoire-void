import { PixelatedHeading } from './PixelatedHeading';
import { PixelatedText } from './PixelatedText';
import styles from '../styles/EntryHeader.module.css';
import type { DocMedia, HeaderMetaSlot } from '../types';

const MEDIA_ORDER: DocMedia[] = ['text', 'image', 'audio', 'video'];

interface EntryHeaderProps {
  classification?: string;
  title: string;
  filename: string;
  filetype: string;
  author: string;
  sharedWith: string[];
  meta: [HeaderMetaSlot, HeaderMetaSlot];
  media?: DocMedia[];
  tags?: string[];
  drift: number;
}

export function EntryHeader({
  classification,
  title,
  filename,
  filetype,
  author,
  sharedWith,
  meta,
  media,
  tags,
  drift,
}: EntryHeaderProps) {
  const mediaLine = media
    ? MEDIA_ORDER.map((m) => `${m}[${media.includes(m) ? 'X' : ' '}]`).join('  ')
    : null;
  return (
    <header className={styles.header}>
      {classification && (
        <div className={styles.classification}>
          <span className="visually-hidden">{classification}</span>
          <PixelatedText letterSpacing={3} textTransform="uppercase">{classification}</PixelatedText>
        </div>
      )}
      <h1 className="visually-hidden">{title}</h1>
      <PixelatedHeading
        lines={[title]}
        renderSize={17}
        scale={3}
        align="left"
        lineHeight={1.05}
        className={styles.title}
      />
      <div className={styles.metaBlock} aria-label="Document metadata">
        <ChromeRow label="filename" value={filename} />
        <ChromeRow label="filetype" value={filetype} />
        <ChromeRow label="author" value={author} />
        <ChromeRow label="shared with" value={sharedWith.join(' · ')} />
        <ChromeRow label={meta[0].label.toLowerCase()} value={meta[0].value} />
        <ChromeRow label={meta[1].label.toLowerCase()} value={meta[1].value} />
        {mediaLine && <ChromeRow label="media" value={mediaLine} />}
        {tags && tags.length > 0 && (
          <ChromeRow label="tags" value={tags.join(', ')} />
        )}
      </div>
      <div className={styles.divider}>
        <span className={styles.dividerBar} />
        <span className={styles.driftAnchor} aria-hidden="true">
          {`Δ ${drift.toFixed(2)}`}
        </span>
      </div>
    </header>
  );
}

function ChromeRow({ label, value }: { label: string; value: string }) {
  // Render each word as its own PixelatedText bitmap with literal text-
  // node spaces between, so long values wrap to additional lines on
  // narrow containers instead of triggering the bitmap's `maxWidth:
  // 100%` shrink-to-fit (which downscales the whole line and makes
  // tags/long-strings unreadable). Browsers wrap inline-block siblings
  // at whitespace text nodes the same as plain text.
  const words = value.split(' ').filter((w) => w.length > 0);
  return (
    <div className={styles.row}>
      <span className="visually-hidden">{`${label}: ${value}`}</span>
      <span className={styles.rowLabel} aria-hidden="true">
        <PixelatedText renderSize={7} letterSpacing={0.6}>{`${label}:`}</PixelatedText>
      </span>
      <span className={styles.rowValue} aria-hidden="true">
        {words.map((word, i) => (
          <span key={i}>
            {i > 0 && ' '}
            <PixelatedText renderSize={7} letterSpacing={0.4}>{word}</PixelatedText>
          </span>
        ))}
      </span>
    </div>
  );
}
