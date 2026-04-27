import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from '../museum/Scene'
import { CarcosaScene, returnPortalZone } from '../museum/CarcosaScene'
import { walkableRects, pedestalPositions, exitZone, carcosaDoorZone, EXIT_Z_POS } from '../museum/sceneConstants'
import { DOOR_W, DOOR_H } from '../museum/frameTicker'
import { Controls, type InputState, type Trigger } from '../museum/Controls'
import { TouchControls } from '../museum/TouchControls'
import { Effects } from '../museum/Effects'
import { Timer } from '../museum/Timer'
import { DoorPrompt } from '../museum/DoorPrompt'
import { glitchOut } from '../museum/effects/glitchOutUniform'
import { useNavigate } from '../hooks/useNavigate'
import styles from '../styles/Museum.module.css'

const TOTAL_MS = 5 * 60 * 1000
const GLITCH_MS = 1400
const FADE_MS = 700           // door-to-cover fade
type SceneId = 'museum' | 'carcosa'
type SpawnPose = { pos: [number, number, number]; lookAt: [number, number, number] }

const MUSEUM_SPAWN: SpawnPose = { pos: [0, 1.6, 11], lookAt: [0, 1.6, 0] }
const MUSEUM_RETURN_SPAWN: SpawnPose = { pos: [0, 1.6, -10.5], lookAt: [0, 1.6, 0] }
const CARCOSA_SPAWN: SpawnPose = { pos: [0, 1.6, -8.8], lookAt: [0, 1.6, 0] }

// Carcosa play area (kept inline now that the scene lives inside the museum
// page rather than its own route).
const CARCOSA_BOUNDS = [{ minX: -15, maxX: 15, minZ: -9.8, maxZ: 15 }]

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
  const swappingRef = useRef(false)
  const [activeDoor, setActiveDoor] = useState<number | null>(null)
  const [fadeProgress, setFadeProgress] = useState(0)
  const [activeScene, setActiveScene] = useState<SceneId>('museum')
  const [spawn, setSpawn] = useState<SpawnPose>(MUSEUM_SPAWN)

  // Countdown loop (rAF-based) — keeps running through scene swaps so the
  // timer persists when the player is in Carcosa.
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      setMsLeft((prev) => {
        const next = prev - dt
        if (next <= 0 && !exitingRef.current) runGlitchThen('/cover')
        return Math.max(0, next)
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runGlitchThen = (to: string) => {
    if (exitingRef.current) return
    exitingRef.current = true
    const start = performance.now()
    const ramp = (now: number) => {
      const t = Math.min(1, (now - start) / GLITCH_MS)
      glitchOut.value = t
      if (t < 1) {
        requestAnimationFrame(ramp)
      } else {
        glitchOut.value = 0
        navigate(to)
      }
    }
    requestAnimationFrame(ramp)
  }

  const runFadeThen = (to: string) => {
    if (exitingRef.current) return
    exitingRef.current = true
    const start = performance.now()
    const ramp = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS)
      setFadeProgress(t)
      if (t < 1) requestAnimationFrame(ramp)
      else navigate(to)
    }
    requestAnimationFrame(ramp)
  }

  // In-page scene swap with a brief glitch flicker — Timer + Effects pipeline
  // persist. The glitch peaks halfway through, where the scene + spawn pose
  // are swapped, so the swap itself is hidden inside the noise.
  const SWAP_GLITCH_MS = 320
  const SWAP_GLITCH_PEAK = 0.45
  const swapToScene = (scene: SceneId, nextSpawn: SpawnPose) => {
    if (exitingRef.current || swappingRef.current) return
    swappingRef.current = true
    const start = performance.now()
    let swapped = false
    const ramp = (now: number) => {
      const t = (now - start) / SWAP_GLITCH_MS
      if (t < 1) {
        // Triangle: 0 → peak at t=0.5 → 0. Swap at the peak.
        glitchOut.value = SWAP_GLITCH_PEAK * (1 - Math.abs(t * 2 - 1))
        if (!swapped && t >= 0.5) {
          swapped = true
          setActiveScene(scene)
          setSpawn(nextSpawn)
        }
        requestAnimationFrame(ramp)
      } else {
        glitchOut.value = 0
        swappingRef.current = false
      }
    }
    requestAnimationFrame(ramp)
  }

  const doors: Trigger[] = useMemo(() => {
    if (activeScene === 'museum') {
      return [
        // Exit on +Z wall — aim-based: prompt shows whenever the reticle is
        // on the door panel within maxDist, regardless of player position.
        {
          zone: exitZone,
          onActivate: () => runFadeThen('/cover'),
          label: 'EXIT',
          aim: {
            min: [-DOOR_W / 2, 0, EXIT_Z_POS - 0.05],
            max: [ DOOR_W / 2, DOOR_H, EXIT_Z_POS + 0.05],
            maxDist: 3,
          },
        },
        // Carcosa door — walk through to teleport, no prompt and no fade.
        { zone: carcosaDoorZone, onActivate: () => swapToScene('carcosa', CARCOSA_SPAWN), facing: [0, -1], instant: true },
      ]
    }
    // In Carcosa: walk through the return portal to teleport back.
    return [
      { zone: returnPortalZone, onActivate: () => swapToScene('museum', MUSEUM_RETURN_SPAWN), facing: [0, -1], instant: true },
    ]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScene])

  // ESC exits immediately via glitch-out from any scene.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') runGlitchThen('/cover')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sceneWalkable = activeScene === 'museum' ? walkableRects : CARCOSA_BOUNDS
  const scenePedestals = activeScene === 'museum' ? pedestalPositions : []
  const sceneBackground = activeScene === 'museum' ? '#f0f0f0' : '#ffffff'

  return (
    <div className={styles.museum}>
      <Canvas
        flat
        camera={{ fov: 68, near: 0.05, far: 4000, position: [0, 1.6, 11] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[sceneBackground]} />
        <Suspense fallback={null}>
          {/* Both scenes stay mounted so swapping between them is instant —
              re-mounting Scene on return rebuilds every voxel pedestal +
              cartridge label canvas, which is what made the museum
              re-entry feel laggy. visible=false skips draw + most
              traversal but preserves all useMemo state. */}
          <group visible={activeScene === 'museum'}>
            <Scene />
          </group>
          <group visible={activeScene === 'carcosa'}>
            <CarcosaScene />
          </group>
          <Effects />
        </Suspense>
        <Controls
          input={inputRef}
          touch={touch}
          triggers={doors}
          walkableRects={sceneWalkable}
          pedestalPositions={scenePedestals}
          spawn={spawn.pos}
          spawnLookAt={spawn.lookAt}
          onActiveTriggerChange={setActiveDoor}
        />
      </Canvas>
      <Timer ms={msLeft} />
      {touch && <TouchControls input={inputRef} />}
      {activeDoor !== null && (
        <DoorPrompt
          label={doors[activeDoor].label ?? 'OPEN'}
          touch={touch}
          onActivate={doors[activeDoor].onActivate}
        />
      )}
      <div className={styles.cursor} />
      <div className={styles.hintRow}>
        {touch ? (
          <>
            <span className={styles.hint}>LEFT MOVE</span>
            <span className={styles.hint}>RIGHT LOOK</span>
          </>
        ) : (
          <>
            <span className={styles.hint}>WASD/ARROWS</span>
            <span className={styles.hint}>MOUSE LOOK</span>
            <span className={styles.hint}>E INTERACT</span>
          </>
        )}
      </div>
      {/* Fade overlay shared by door-to-cover fades and scene-swap fades. */}
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
