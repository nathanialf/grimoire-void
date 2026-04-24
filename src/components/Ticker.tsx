import { createPortal } from 'react-dom'
import { PixelatedText } from './PixelatedText'
import styles from '../styles/Ticker.module.css'

const TEXT = 'PLACEHOLDER TEXT'
const SEPARATOR = '█'
// Total flex items = REPEAT * 2 (text + separator pairs). Must be even so that
// animating translateX(-50%) lands exactly on an identical point in the pattern.
const REPEAT = 20

interface TickerProps {
  position: 'top' | 'bottom'
}

export function Ticker({ position }: TickerProps) {
  return createPortal(
    <div className={`${styles.ticker} ${position === 'top' ? styles.top : styles.bottom}`} aria-hidden="true">
      <div className={styles.track}>
        {Array.from({ length: REPEAT * 2 }, (_, i) => (
          <span key={i} className={styles.item}>
            <PixelatedText letterSpacing={1} textTransform="uppercase">
              {i % 2 === 0 ? TEXT : SEPARATOR}
            </PixelatedText>
          </span>
        ))}
      </div>
    </div>,
    document.body,
  )
}
