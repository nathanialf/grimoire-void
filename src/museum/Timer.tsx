import styles from '../styles/Museum.module.css'

interface Props {
  ms: number
}

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  const rs = s % 60
  return `${m}:${rs.toString().padStart(2, '0')}`
}

export function Timer({ ms }: Props) {
  const sec = ms / 1000
  const tier = sec <= 10 ? 'blink' : sec <= 30 ? 'danger' : sec <= 60 ? 'amber' : 'ok'
  return (
    <div className={`${styles.timer} ${styles[`timer_${tier}`]}`}>
      {fmt(ms)}
    </div>
  )
}
