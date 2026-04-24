import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from '../museum/Scene'
import { roomBounds, pedestalPositions, exitZone } from '../museum/sceneConstants'
import { Controls, type InputState } from '../museum/Controls'
import { TouchControls } from '../museum/TouchControls'
import { Effects } from '../museum/Effects'
import { Timer } from '../museum/Timer'
import { glitchOut } from '../museum/effects/glitchOutUniform'
import { useNavigate } from '../hooks/useNavigate'
import styles from '../styles/Museum.module.css'

const TOTAL_MS = 5 * 60 * 1000
const GLITCH_MS = 1400

function detectTouch(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches
}

export function MuseumPage() {
  const navigate = useNavigate()
  const [msLeft, setMsLeft] = useState(TOTAL_MS)
  const inputRef = useRef<InputState>({ forward: 0, strafe: 0, yaw: 0, pitch: 0 })
  const touch = detectTouch()
  const exitingRef = useRef(false)

  // Countdown loop (rAF-based)
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      setMsLeft((prev) => {
        const next = prev - dt
        if (next <= 0 && !exitingRef.current) beginExit()
        return Math.max(0, next)
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const beginExit = () => {
    if (exitingRef.current) return
    exitingRef.current = true
    const start = performance.now()
    const ramp = (now: number) => {
      const t = Math.min(1, (now - start) / GLITCH_MS)
      glitchOut.value = t
      if (t < 1) {
        requestAnimationFrame(ramp)
      } else {
        // Settle and route
        glitchOut.value = 0
        navigate('/cover')
      }
    }
    requestAnimationFrame(ramp)
  }

  // ESC key exits immediately (via glitch-out)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') beginExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.museum}>
      <Canvas
        flat
        camera={{ fov: 68, near: 0.05, far: 60, position: [0, 1.6, 5] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#f0f0f0']} />
        <Suspense fallback={null}>
          <Scene />
          <Effects />
        </Suspense>
        <Controls
          input={inputRef}
          touch={touch}
          onExitZone={beginExit}
          exitZone={exitZone}
          roomBounds={roomBounds}
          pedestalPositions={pedestalPositions}
        />
      </Canvas>
      <Timer ms={msLeft} />
      {touch && <TouchControls input={inputRef} />}
      {!touch && (
        <div className={styles.hint}>
          CLICK TO ENTER · WASD · ESC EXITS
        </div>
      )}
    </div>
  )
}
