import { type ReactNode } from 'react'
import { renderText } from '../utils/renderText'
import styles from '../styles/MetaTable.module.css'

export interface MetaRow {
  label: string
  value: ReactNode
  variant?: 'accent' | 'danger'
}

export function MetaTable({ rows }: { rows: MetaRow[] }) {
  return (
    <div className={styles.table}>
      {rows.map((r, i) => (
        <div key={i} className={styles.row}>
          <span className={styles.label}>{renderText(r.label)}</span>
          <span
            className={
              r.variant === 'danger'
                ? styles.valueDanger
                : r.variant === 'accent'
                  ? styles.valueAccent
                  : styles.value
            }
          >
            {typeof r.value === 'string' ? renderText(r.value) : r.value}
          </span>
        </div>
      ))}
    </div>
  )
}
