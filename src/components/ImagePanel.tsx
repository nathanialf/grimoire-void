import { PixelatedText } from './PixelatedText';
import styles from '../styles/ImagePanel.module.css';

interface ImagePanelProps {
  src?: string;
  alt?: string;
  caption?: string;
  overlay?: string;
  aspect?: 'tall' | 'wide' | 'square';
  placeholderLabel?: string;
}

export function ImagePanel({
  src,
  alt,
  caption,
  overlay,
  aspect,
  placeholderLabel = 'illustration pending',
}: ImagePanelProps) {
  return (
    <figure className={`${styles.panel} ca-fx`}>
      {src ? (
        <img className={styles.image} src={src} alt={alt || ''} />
      ) : (
        <div className={`${styles.placeholder} ${aspect ? styles[aspect] : ''}`}>
          <span className={styles.placeholderText}>
            <span className="visually-hidden">{placeholderLabel}</span>
            <PixelatedText letterSpacing={2} textTransform="uppercase">{placeholderLabel}</PixelatedText>
          </span>
        </div>
      )}
      {overlay && (
        <div className={styles.overlay}>
          <span className={styles.overlayText}>
            <span className="visually-hidden">{overlay}</span>
            <PixelatedText>{overlay}</PixelatedText>
          </span>
        </div>
      )}
      {caption && (
        <figcaption className={styles.caption}>{caption}</figcaption>
      )}
    </figure>
  );
}
