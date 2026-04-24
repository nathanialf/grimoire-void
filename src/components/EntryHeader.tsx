import { PixelatedHeading } from './PixelatedHeading';
import { PixelatedText } from './PixelatedText';
import styles from '../styles/EntryHeader.module.css';

interface EntryHeaderProps {
  classification?: string;
  title: string;
  subtitle?: string;
  tags?: string[];
}

export function EntryHeader({ classification, title, subtitle, tags }: EntryHeaderProps) {
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
      {subtitle && (
        <>
          <p className={`${styles.subtitle} visually-hidden`}>{subtitle}</p>
          <PixelatedHeading
            lines={[subtitle]}
            renderSize={14}
            scale={2}
            fontStyle="italic"
            fontWeight={400}
            align="left"
            alphaThreshold={60}
            color={getComputedStyle(document.documentElement).getPropertyValue('--color-text-dim').trim()}
            className={styles.subtitle}
          />
        </>
      )}
      {tags && tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
      <div className={styles.divider} />
    </header>
  );
}
