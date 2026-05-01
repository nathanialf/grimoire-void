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
  return (
    <div className={styles.row}>
      <span className="visually-hidden">{`${label}: ${value}`}</span>
      <span className={styles.rowLabel} aria-hidden="true">
        <PixelatedText renderSize={7} letterSpacing={0.6}>{`${label}:`}</PixelatedText>
      </span>
      <span className={styles.rowValue} aria-hidden="true">
        <PixelatedText renderSize={7} letterSpacing={0.4}>{value}</PixelatedText>
      </span>
    </div>
  );
}
