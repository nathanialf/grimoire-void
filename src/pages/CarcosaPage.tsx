import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { CarcosaScene, returnPortalZone } from '../museum/CarcosaScene'
import { Controls, type InputState } from '../museum/Controls'
import { TouchControls } from '../museum/TouchControls'
import { Effects } from '../museum/Effects'
import { museumSpawnIntent } from '../museum/spawnIntent'
import { useNavigate } from '../hooks/useNavigate'
import styles from '../styles/Museum.module.css'

const FADE_MS = 1000

// Bounded play area: prevents the player from walking behind the return
// portal (one-sided plane) and caps wandering into the red expanse.
// minZ matches the portal's z (PORTAL_Z = -10) so the player can step
// fully into the trigger zone (z ∈ [-10, -9.1]) and fire beginReturn — but
// cannot pass through to the back side of the door.
const CARCOSA_BOUNDS = [{ minX: -15, maxX: 15, minZ: -10, maxZ: 15 }]

function detectTouch(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches
}

export function CarcosaPage() {
  const navigate = useNavigate()
  const inputRef = useRef<InputState>({ forward: 0, strafe: 0, yaw: 0, pitch: 0 })
  const touch = detectTouch()
  const exitingRef = useRef(false)
  const [fadeProgress, setFadeProgress] = useState(0)

  const beginReturn = () => {
    if (exitingRef.current) return
    exitingRef.current = true
    museumSpawnIntent.set('fromCarcosa')
    const start = performance.now()
    const ramp = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS)
      setFadeProgress(t)
      if (t < 1) {
        requestAnimationFrame(ramp)
      } else {
        navigate('/museum')
      }
    }
    requestAnimationFrame(ramp)
  }

  // ESC also returns.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') beginReturn()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.museum} style={{ background: '#ffffff' }}>
      <Canvas
        flat
        camera={{ fov: 70, near: 0.1, far: 4000, position: [0, 1.6, 0] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#ffffff']} />
        <Suspense fallback={null}>
          <CarcosaScene />
          <Effects />
        </Suspense>
        <Controls
          input={inputRef}
          touch={touch}
          triggers={[{ zone: returnPortalZone, onEnter: beginReturn }]}
          walkableRects={CARCOSA_BOUNDS}
          pedestalPositions={[]}
          spawn={[0, 1.6, -8.8]}
          spawnLookAt={[0, 1.6, 0]}
        />
      </Canvas>
      {touch && <TouchControls input={inputRef} />}
      {!touch && (
        <div className={styles.hint}>
          WASD · ESC RETURNS
        </div>
      )}
      {/* Fade-to-black overlay during return transition. */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          opacity: fadeProgress,
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />
    </div>
  )
}
