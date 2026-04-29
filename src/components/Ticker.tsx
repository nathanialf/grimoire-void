import { createPortal } from 'react-dom'
import { PixelatedText } from './PixelatedText'
import styles from '../styles/Ticker.module.css'

export type TickerVariant = 'placeholder' | 'template'

const VARIANT_TEXTS: Record<TickerVariant, [string, string]> = {
  placeholder: ['PLACEHOLDER TEXT', 'DO NOT DEPLOY'],
  template: ['TEMPLATE', 'DO NOT DEPLOY'],
}

const SEPARATOR = '█'
// Each half of the track holds UNITS pattern repeats of [TEXT1, SEP, TEXT2,
// SEP]. The track is two identical halves rendered side-by-side; the
// animation translates by -50% (= one half-width) so the second half slides
// into place seamlessly. UNITS is sized large enough that even at 4K width
// the half's natural content overflows the viewport — that is what
// guarantees the loop point is offscreen and there is no end whitespace.
const UNITS = 16

interface TickerProps {
  position: 'top' | 'bottom'
  variant?: TickerVariant
}

function HalfTrack({ texts }: { texts: readonly [string, string] }) {
  return (
    <div className={styles.half}>
      {Array.from({ length: UNITS * 4 }, (_, i) => {
        const content = i % 2 === 1 ? SEPARATOR : texts[(i / 2) % 2]
        return (
          <span key={i} className={styles.item}>
            <PixelatedText letterSpacing={1} textTransform="uppercase">
              {content}
            </PixelatedText>
          </span>
        )
      })}
    </div>
  )
}

export function Ticker({ position, variant = 'placeholder' }: TickerProps) {
  const texts = VARIANT_TEXTS[variant]
  const variantClass = variant === 'template' ? styles.template : ''
  return createPortal(
    <div
      className={`${styles.ticker} ${position === 'top' ? styles.top : styles.bottom} ${variantClass}`}
      aria-hidden="true"
    >
      <div className={styles.track}>
        <HalfTrack texts={texts} />
        <HalfTrack texts={texts} />
      </div>
    </div>,
    document.body,
  )
}
