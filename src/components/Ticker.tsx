import { createPortal } from 'react-dom'
import { PixelatedText } from './PixelatedText'
import styles from '../styles/Ticker.module.css'

const TEXTS = ['PLACEHOLDER TEXT', 'DO NOT DEPLOY']
const SEPARATOR = '█'
// Pattern unit = [TEXT1, SEP, TEXT2, SEP] (4 items). Total items must be a
// multiple of 8 so animating translateX(-50%) lands on an identical point in
// the pattern (half = multiple of 4 = whole units).
const UNITS = 10
const TOTAL = UNITS * 4

interface TickerProps {
  position: 'top' | 'bottom'
}

export function Ticker({ position }: TickerProps) {
  return createPortal(
    <div className={`${styles.ticker} ${position === 'top' ? styles.top : styles.bottom}`} aria-hidden="true">
      <div className={styles.track}>
        {Array.from({ length: TOTAL }, (_, i) => {
          const content = i % 2 === 1 ? SEPARATOR : TEXTS[(i / 2) % 2]
          return (
            <span key={i} className={styles.item}>
              <PixelatedText letterSpacing={1} textTransform="uppercase">
                {content}
              </PixelatedText>
            </span>
          )
        })}
      </div>
    </div>,
    document.body,
  )
}
