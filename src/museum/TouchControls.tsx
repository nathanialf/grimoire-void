import { useEffect, useRef } from 'react'
import type { InputState } from './Controls'
import styles from '../styles/Museum.module.css'

interface Props {
  input: React.MutableRefObject<InputState>
}

// Left half: virtual joystick (first-touch spawn). Right half: swipe-look.
export function TouchControls({ input }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const stickRef = useRef<HTMLDivElement | null>(null)
  const stickKnobRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const moveTouchIds = new Map<number, { x0: number; y0: number }>()
    const lookTouchIds = new Map<number, { x: number; y: number }>()

    const show = (x: number, y: number) => {
      const stick = stickRef.current
      if (!stick) return
      stick.style.left = `${x - 64}px`
      stick.style.top = `${y - 64}px`
      stick.style.opacity = '0.8'
      const knob = stickKnobRef.current
      if (knob) {
        knob.style.transform = 'translate(0px, 0px)'
      }
    }
    const hide = () => {
      const stick = stickRef.current
      if (stick) stick.style.opacity = '0'
    }

    const onStart = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        const isLeft = t.clientX < window.innerWidth / 2
        if (isLeft && moveTouchIds.size === 0) {
          moveTouchIds.set(t.identifier, { x0: t.clientX, y0: t.clientY })
          show(t.clientX, t.clientY)
        } else if (!isLeft) {
          lookTouchIds.set(t.identifier, { x: t.clientX, y: t.clientY })
        }
      }
    }

    const onMove = (e: TouchEvent) => {
      e.preventDefault()
      for (const t of Array.from(e.changedTouches)) {
        const m = moveTouchIds.get(t.identifier)
        if (m) {
          const dx = t.clientX - m.x0
          const dy = t.clientY - m.y0
          const maxR = 64
          const mag = Math.min(Math.hypot(dx, dy), maxR)
          const angle = Math.atan2(dy, dx)
          const nx = (Math.cos(angle) * mag) / maxR
          const ny = (Math.sin(angle) * mag) / maxR
          input.current.strafe = nx
          input.current.forward = -ny
          const knob = stickKnobRef.current
          if (knob) knob.style.transform = `translate(${Math.cos(angle) * mag}px, ${Math.sin(angle) * mag}px)`
        }
        const l = lookTouchIds.get(t.identifier)
        if (l) {
          const dx = t.clientX - l.x
          const dy = t.clientY - l.y
          // Sensitivity: radians per pixel of swipe.
          input.current.yaw += dx * 0.003
          input.current.pitch += dy * 0.003
          lookTouchIds.set(t.identifier, { x: t.clientX, y: t.clientY })
        }
      }
    }

    const onEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (moveTouchIds.delete(t.identifier)) {
          input.current.forward = 0
          input.current.strafe = 0
          hide()
        }
        lookTouchIds.delete(t.identifier)
      }
    }

    host.addEventListener('touchstart', onStart, { passive: false })
    host.addEventListener('touchmove', onMove, { passive: false })
    host.addEventListener('touchend', onEnd, { passive: false })
    host.addEventListener('touchcancel', onEnd, { passive: false })

    return () => {
      host.removeEventListener('touchstart', onStart)
      host.removeEventListener('touchmove', onMove)
      host.removeEventListener('touchend', onEnd)
      host.removeEventListener('touchcancel', onEnd)
    }
  }, [input])

  return (
    <div ref={hostRef} className={styles.touchLayer}>
      <div ref={stickRef} className={styles.joystick}>
        <div ref={stickKnobRef} className={styles.joystickKnob} />
      </div>
    </div>
  )
}
