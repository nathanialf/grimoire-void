import { PixelatedText } from './PixelatedText'
import styles from '../styles/ScrollControls.module.css'

interface ScrollControlsProps {
  onUp: () => void
  onDown: () => void
  atTop?: boolean
  atBottom?: boolean
  hidden?: boolean
}

export function ScrollControls({ onUp, onDown, atTop, atBottom, hidden }: ScrollControlsProps) {
  if (hidden) return null

  return (
    <div className={styles.controls} data-scroll-controls>
      <button
        className={`${styles.btn} ${atTop ? styles.btnDisabled : ''}`}
        onClick={onUp}
        aria-label="Scroll up"
        disabled={atTop}
      >
        <span className={styles.arrow}>
          <span className="visually-hidden">&#x25B2;</span>
          <PixelatedText renderSize={10} scale={2}>&#x25B2;</PixelatedText>
        </span>
        <span className={styles.label}>
          <span className="visually-hidden">PG UP</span>
          <PixelatedText letterSpacing={1}>PG UP</PixelatedText>
        </span>
      </button>
      <button
        className={`${styles.btn} ${atBottom ? styles.btnDisabled : ''}`}
        onClick={onDown}
        aria-label="Scroll down"
        disabled={atBottom}
      >
        <span className={styles.arrow}>
          <span className="visually-hidden">&#x25BC;</span>
          <PixelatedText renderSize={10} scale={2}>&#x25BC;</PixelatedText>
        </span>
        <span className={styles.label}>
          <span className="visually-hidden">PG DN</span>
          <PixelatedText letterSpacing={1}>PG DN</PixelatedText>
        </span>
      </button>
    </div>
  )
}
