import styles from '../styles/Museum.module.css'

interface Props {
  label: string
  touch: boolean
  onActivate: () => void
}

export function DoorPrompt({ label, touch, onActivate }: Props) {
  if (touch) {
    return (
      <button
        type="button"
        className={styles.prompt}
        onTouchStart={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onActivate()
        }}
      >
        {label}
      </button>
    )
  }
  return <div className={styles.prompt}>[E] {label}</div>
}
