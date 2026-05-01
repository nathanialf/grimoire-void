import styles from '../styles/Museum.module.css'

interface Props {
  label: string
  touch: boolean
  carcosa: boolean
  onActivate: () => void
}

export function DoorPrompt({ label, touch, carcosa, onActivate }: Props) {
  const cls = carcosa ? styles.promptCarcosa : styles.prompt
  if (touch) {
    return (
      <button
        type="button"
        className={cls}
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
  return <div className={cls}>[E] {label}</div>
}
