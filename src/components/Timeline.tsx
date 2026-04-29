import { renderText } from '../utils/renderText'
import shared from '../styles/shared.module.css'
import styles from '../styles/Timeline.module.css'

export interface TimelineEntry {
  timestamp: string
  event: string
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className={shared.prose}>
      <ul className={styles.timeline}>
        {entries.map((e, i) => (
          <li key={i}>
            <span className={styles.timestamp}>{e.timestamp}</span>
            <span className={styles.event}>{renderText(e.event)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
