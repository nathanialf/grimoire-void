import { useEffect, useRef, useState } from 'react'
import { bootSequence, idleStatus } from './terminalLog/messages'
import styles from '../styles/Museum.module.css'

interface Props {
  ms: number
}

const MAX_LINES = 32
// Boot pacing — fast but irregular, like a real boot log.
const BOOT_MIN_MS = 60
const BOOT_MAX_MS = 240
// Idle pacing — sprinkles, not constant scrolling.
const IDLE_MIN_MS = 4000
const IDLE_MAX_MS = 11000

function fmtTimer(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  const rs = s % 60
  return `${m}:${rs.toString().padStart(2, '0')} TO DERESOLUTION`
}

function tier(ms: number): 'ok' | 'amber' | 'danger' | 'blink' {
  const sec = ms / 1000
  if (sec <= 10) return 'blink'
  if (sec <= 30) return 'danger'
  if (sec <= 60) return 'amber'
  return 'ok'
}

export function TerminalLog({ ms }: Props) {
  const [lines, setLines] = useState<string[]>([])
  const linesRef = useRef<string[]>([])

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    const push = (line: string) => {
      const next = [...linesRef.current, line]
      if (next.length > MAX_LINES) next.splice(0, next.length - MAX_LINES)
      linesRef.current = next
      setLines(next)
    }

    const boot = bootSequence()
    let idx = 0

    const schedule = (delay: number, fn: () => void) => {
      timer = window.setTimeout(() => {
        if (cancelled) return
        fn()
      }, delay)
    }

    const stepBoot = () => {
      if (idx >= boot.length) {
        // Transition to idle phase.
        scheduleIdle()
        return
      }
      push(boot[idx])
      idx++
      schedule(BOOT_MIN_MS + Math.random() * (BOOT_MAX_MS - BOOT_MIN_MS), stepBoot)
    }

    const scheduleIdle = () => {
      schedule(IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS), () => {
        push(idleStatus())
        scheduleIdle()
      })
    }

    // Kick off boot.
    schedule(120, stepBoot)

    return () => {
      cancelled = true
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [])

  const t = tier(ms)
  const timerClass =
    t === 'ok' ? styles.terminalTimer_ok
    : t === 'amber' ? styles.terminalTimer_amber
    : t === 'danger' ? styles.terminalTimer_danger
    : styles.terminalTimer_blink

  return (
    <div className={styles.terminal} aria-hidden="true">
      {lines.map((line, i) => (
        <span key={`${i}-${line}`} className={styles.terminalLine}>
          {line}
        </span>
      ))}
      <span className={`${styles.terminalLine} ${styles.terminalTimerLine} ${timerClass}`}>
        {fmtTimer(ms)}
      </span>
    </div>
  )
}
