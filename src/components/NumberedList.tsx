import { renderText } from '../utils/renderText'
import shared from '../styles/shared.module.css'
import styles from '../styles/NumberedList.module.css'

export function NumberedList({ items }: { items: string[] }) {
  return (
    <div className={shared.prose}>
      <ol className={styles.list}>
        {items.map((item, i) => (
          <li key={i}>{renderText(item)}</li>
        ))}
      </ol>
    </div>
  )
}
