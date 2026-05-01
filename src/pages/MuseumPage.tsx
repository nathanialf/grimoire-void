import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Scene } from '../museum/Scene'
import { CarcosaScene, returnPortalZone } from '../museum/CarcosaScene'
import {
  walkableRects,
  pedestalPositions,
  exitZone,
  carcosaDoorZone,
  EXIT_Z_POS,
  cartDispenserFixture,
  toolMountFixture,
  variantTerminalFixture,
  wallFixtureAABB,
  fixtureBoxAABB,
  PEDESTAL_SIZE,
  MUSEUM_PEDESTALS,
} from '../museum/sceneConstants'
import { DOOR_W, DOOR_H } from '../museum/frameTicker'
import { Controls, type InputState, type Trigger } from '../museum/Controls'
import { TouchControls } from '../museum/TouchControls'
import { Effects } from '../museum/Effects'
import { TerminalLog } from '../museum/TerminalLog'
import { DoorPrompt } from '../museum/DoorPrompt'
import { HeldTool } from '../museum/CartTool'
import { nodeAabb } from '../museum/nodeAabb'
import { TerminalInput } from '../museum/TerminalInput'
import { pixelSort } from '../museum/effects/pixelSortUniform'
import { datamosh } from '../museum/effects/datamoshUniform'
import { useNavigate } from '../hooks/useNavigate'
import {
  derez as derezInventory,
  dispenseCart,
  dockCart,
  pickUpPartialCart,
  pickUpTool,
  scanNode,
  useInventory,
} from '../data/inventory'
import {
  cartridgeStateOf,
  gatheredOf,
  setCartridge,
  useCartridgeStates,
} from '../data/loadState'
import {
  BOOT_VARIATIONS,
  findVariationByKey,
  type Variation,
} from '../data/variations'
import styles from '../styles/Museum.module.css'
import appStyles from '../styles/App.module.css'

const TOTAL_MS = 5 * 60 * 1000
const DEREZ_MS = 1600         // pixel-sort ramp on timer expiry / ESC
const DEREZ_HOLD_MS = 1500    // hold the fully-sorted output before navigating
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
  const [isExiting, setIsExiting] = useState(false)
  const [activeVariationKey, setActiveVariationKey] = useState<string>(BOOT_VARIATIONS[0])
  const [terminalOpen, setTerminalOpen] = useState(false)
  const activeVariation: Variation = useMemo(
    () => findVariationByKey(activeVariationKey) ?? findVariationByKey(BOOT_VARIATIONS[0])!,
    [activeVariationKey],
  )
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  // Brief flash overlay shown the instant a screenshot is taken so the
  // player has visual feedback that the capture fired.
  const [flashOpacity, setFlashOpacity] = useState(0)
  // Holds the loading overlay over the canvas until the inner Suspense
  // resolves (GLTF models loaded) and Three.js has painted at least one
  // frame, so the player doesn't see a blank canvas during scene init.
  const [sceneReady, setSceneReady] = useState(false)

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
        if (next <= 0 && !exitingRef.current) runDerezThen('/cover')
        return Math.max(0, next)
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runDerezThen = (to: string) => {
    if (exitingRef.current) return
    exitingRef.current = true
    setIsExiting(true)
    // Wipe the held cart at the START of the derez, hidden inside the
    // pixel-sort chaos — doing it at navigation would briefly flash the
    // empty scope to the player before the cover page transitions in.
    derezInventory()
    const start = performance.now()
    const ramp = (now: number) => {
      const elapsed = now - start
      if (elapsed < DEREZ_MS) {
        // Phase 1: ramp 0 → 1.
        pixelSort.value = elapsed / DEREZ_MS
        requestAnimationFrame(ramp)
      } else if (elapsed < DEREZ_MS + DEREZ_HOLD_MS) {
        // Phase 2: hold at full sort.
        pixelSort.value = 1
        requestAnimationFrame(ramp)
      } else {
        // Phase 3: release and navigate.
        pixelSort.value = 0
        navigate(to)
      }
    }
    requestAnimationFrame(ramp)
  }

  const runFadeThen = (to: string) => {
    if (exitingRef.current) return
    exitingRef.current = true
    setIsExiting(true)
    // EXIT door is the other wipe path — same start-of-fade timing as
    // the timer-derez above.
    derezInventory()
    const start = performance.now()
    const ramp = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS)
      setFadeProgress(t)
      if (t < 1) requestAnimationFrame(ramp)
      else navigate(to)
    }
    requestAnimationFrame(ramp)
  }

  // Screenshot capture. The HUD elements (TerminalLog, hint row, cursor,
  // touch joysticks) are DOM overlays outside the WebGL canvas, so reading
  // from canvas.toBlob() naturally excludes them — the resulting image is
  // the post-processed scene only. Triggered via the P key (or the screen
  // tap-and-hold gesture on touch devices is not yet wired).
  const captureScreenshot = useCallback(() => {
    const canvas = canvasContainerRef.current?.querySelector('canvas')
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `grimoire-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 'image/png')
    // 120ms white flash for capture feedback.
    setFlashOpacity(0.45)
    requestAnimationFrame(() => {
      setTimeout(() => setFlashOpacity(0), 120)
    })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'p' && e.key !== 'P') return
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      e.preventDefault()
      captureScreenshot()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [captureScreenshot])

  // In-page scene swap with a brief datamosh flicker — Timer + Effects
  // pipeline persist. The mosh peaks halfway through, where the scene +
  // spawn pose are swapped, so the swap itself is hidden inside the noise.
  const SWAP_MOSH_MS = 320
  const SWAP_MOSH_PEAK = 0.45
  const swapToScene = (scene: SceneId, nextSpawn: SpawnPose) => {
    if (exitingRef.current || swappingRef.current) return
    swappingRef.current = true
    const start = performance.now()
    let swapped = false
    const ramp = (now: number) => {
      const t = (now - start) / SWAP_MOSH_MS
      if (t < 1) {
        // Triangle: 0 → peak at t=0.5 → 0. Swap at the peak.
        datamosh.value = SWAP_MOSH_PEAK * (1 - Math.abs(t * 2 - 1))
        if (!swapped && t >= 0.5) {
          swapped = true
          setActiveScene(scene)
          setSpawn(nextSpawn)
        }
        requestAnimationFrame(ramp)
      } else {
        datamosh.value = 0
        swappingRef.current = false
      }
    }
    requestAnimationFrame(ramp)
  }

  const inv = useInventory()
  const cartridgeStates = useCartridgeStates()

  const handleLoadVariation = useCallback((key: string) => {
    setActiveVariationKey(key)
    setTerminalOpen(false)
    swapToScene('carcosa', CARCOSA_SPAWN)
  }, [])

  const doors: Trigger[] = useMemo(() => {
    if (activeScene === 'museum') {
      const triggers: Trigger[] = [
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
      // Variant terminal — opens the keyword/known-variations overlay.
      // Aim-only (no zone) so the player can engage from across the room
      // when looking at it.
      {
        const aabb = wallFixtureAABB(variantTerminalFixture)
        triggers.push({
          zone: { minX: aabb.min[0], maxX: aabb.max[0], minZ: aabb.min[2], maxZ: aabb.max[2] },
          onActivate: () => { setTerminalOpen(true) },
          label: 'USE TERMINAL',
          aim: { min: aabb.min, max: aabb.max, maxDist: 3 },
        })
      }
      // Dispenser is only interactable when the player has the tool
      // equipped AND no cart held — suppress the trigger entirely
      // otherwise. Without the tool there's nothing to load the cart
      // into, so dispensing would just spawn an unusable object.
      if (inv.tool.equipped && inv.cart === null) {
        const aabb = fixtureBoxAABB(cartDispenserFixture)
        triggers.push({
          zone: { minX: aabb.min[0], maxX: aabb.max[0], minZ: aabb.min[2], maxZ: aabb.max[2] },
          onActivate: () => { dispenseCart() },
          label: 'DISPENSE',
          aim: { min: aabb.min, max: aabb.max, maxDist: 2.4 },
        })
      }
      // Tool rack — only present until equipped.
      if (!inv.tool.equipped) {
        const aabb = fixtureBoxAABB(toolMountFixture)
        triggers.push({
          zone: { minX: aabb.min[0], maxX: aabb.max[0], minZ: aabb.min[2], maxZ: aabb.max[2] },
          onActivate: () => { pickUpTool() },
          label: 'PICK UP TOOL',
          aim: { min: aabb.min, max: aabb.max, maxDist: 2.4 },
        })
      }

      // Per-pedestal triggers: dock the held cart, retrieve a partial
      // cart that was previously docked, or surface a wrong-cart hover
      // label naming the slug the pedestal expects. Pedestals already
      // 'complete' contribute no trigger — the entry is permanent.
      const variationNodeIdsBySlug = new Map<string, string[]>()
      for (const v of [activeVariation]) {
        for (const n of v.nodes) {
          const list = variationNodeIdsBySlug.get(n.slug) ?? []
          list.push(n.id)
          variationNodeIdsBySlug.set(n.slug, list)
        }
      }
      for (let i = 0; i < MUSEUM_PEDESTALS.length; i++) {
        const slug = MUSEUM_PEDESTALS[i]
        if (!slug) continue
        const [px, pz] = pedestalPositions[i]
        const half = PEDESTAL_SIZE / 2
        const aabb = {
          min: [px - half, 0, pz - half] as [number, number, number],
          max: [px + half, PEDESTAL_SIZE + 0.6, pz + half] as [number, number, number],
        }
        const zone = { minX: aabb.min[0], maxX: aabb.max[0], minZ: aabb.min[2], maxZ: aabb.max[2] }
        const state = cartridgeStateOf(slug)
        if (state === 'complete') continue

        if (inv.cart && inv.cart.slug === slug) {
          // Dock — partial unless every node in the active variation that
          // binds to this slug is gathered. (Other variations may bind to
          // the same slug; we only know the current variation's expected
          // count, so completion is "all currently-known nodes for this
          // slug are gathered." Future authoring may extend this.)
          const expected = variationNodeIdsBySlug.get(slug) ?? []
          const cart = inv.cart
          const allGathered = expected.length > 0 && expected.every((id) => cart.gathered[id])
          triggers.push({
            zone,
            onActivate: () => {
              const docked = dockCart()
              if (!docked || !docked.slug) return
              const gathered: Record<string, true> = {}
              for (const [k, v] of Object.entries(docked.gathered)) if (v) gathered[k] = true
              setCartridge(docked.slug, allGathered ? 'complete' : 'partial', gathered)
            },
            label: allGathered ? 'DOCK · COMPLETE' : 'DOCK · PARTIAL',
            aim: { min: aabb.min, max: aabb.max, maxDist: 3.5 },
          })
        } else if (inv.cart && inv.cart.slug && inv.cart.slug !== slug) {
          // Wrong-cart HUD — hover label only, no activate. Names the
          // slug this pedestal expects so the player knows where their
          // current cart belongs (and where this one wants to go).
          triggers.push({
            zone,
            onActivate: () => {},
            label: `WRONG CART · ${slug.replace(/-/g, ' ').toUpperCase()}`,
            aim: { min: aabb.min, max: aabb.max, maxDist: 3.5 },
          })
        } else if (!inv.cart && state === 'partial') {
          // Retrieve a partial cart so it can be finished later or in a
          // different variation. Per cartridges.md, partial pedestals
          // continue to surface their bound doc in the wiki — so we
          // leave the persisted state alone here. The held cart is
          // re-bound with the same gathered set.
          triggers.push({
            zone,
            onActivate: () => {
              const ok = pickUpPartialCart(slug, gatheredOf(slug))
              if (ok) setCartridge(slug, 'absent', {})
            },
            label: 'RETRIEVE CART',
            aim: { min: aabb.min, max: aabb.max, maxDist: 3.5 },
          })
        }
      }
      return triggers
    }
    // In Carcosa.
    const triggers: Trigger[] = [
      // Walk through the return portal to teleport back.
      { zone: returnPortalZone, onActivate: () => swapToScene('museum', MUSEUM_RETURN_SPAWN), facing: [0, -1], instant: true },
    ]
    // One scan trigger per node in the active variation. Suppress the
    // prompt entirely once a node is gathered (archived nodes stay
    // visible in the world per spec but become non-interactive). The
    // tool must be equipped — without it, scanning is a no-op anyway.
    if (inv.tool.equipped) {
      const cart = inv.cart
      for (const n of activeVariation.nodes) {
        const alreadyGathered = !!(cart && cart.gathered[n.id])
        if (alreadyGathered) continue
        const aabb = nodeAabb(n)
        const wrongSlug = cart && cart.slug !== null && cart.slug !== n.slug
        let label = 'SCAN'
        if (!cart) label = 'NO CART'
        else if (wrongSlug) label = `WRONG CART · ${n.slug.replace(/-/g, ' ').toUpperCase()}`
        triggers.push({
          zone: { minX: aabb.min[0], maxX: aabb.max[0], minZ: aabb.min[2], maxZ: aabb.max[2] },
          onActivate: () => { scanNode(n.id, n.slug) },
          label,
          aim: { min: aabb.min, max: aabb.max, maxDist: 3 },
        })
      }
    }
    return triggers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScene, inv, cartridgeStates, activeVariation])

  const sceneWalkable = activeScene === 'museum' ? walkableRects : CARCOSA_BOUNDS
  const scenePedestals = activeScene === 'museum' ? pedestalPositions : []
  const sceneBackground = activeScene === 'museum' ? '#f0f0f0' : '#ffffff'

  return (
    <div className={styles.museum}>
      <div ref={canvasContainerRef} style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        flat
        camera={{ fov: 68, near: 0.05, far: 4000, position: [0, 1.6, 11] }}
        gl={{ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      >
        <color attach="background" args={[sceneBackground]} />
        <Suspense fallback={null}>
          {/* Both scenes stay mounted so swapping between them is instant —
              re-mounting Scene on return rebuilds every cartridge label
              canvas, which is what made the museum re-entry feel laggy.
              visible=false skips draw + most traversal but preserves all
              useMemo state. */}
          <group visible={activeScene === 'museum'}>
            <Scene />
          </group>
          <group visible={activeScene === 'carcosa'}>
            <CarcosaScene variation={activeVariation} />
          </group>
          {/* Held tool sits at top-level so it persists across scene
              swaps without re-mounting (which would tear down its
              camera-attachment effect). */}
          <HeldTool />
          <Effects />
          <FirstFrameProbe onReady={() => setSceneReady(true)} />
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
          locked={isExiting || terminalOpen}
        />
      </Canvas>
      </div>
      <TerminalLog ms={msLeft} />
      {touch && <TouchControls input={inputRef} />}
      {/* Guard against the index briefly outliving its trigger: when an
          aim trigger removes itself in response to its own onActivate
          (dispenser, tool rack, demo node), the doors array shrinks
          before Controls' next-frame update clears `activeDoor`. The
          stale index would dereference `undefined` without this check. */}
      {activeDoor !== null && doors[activeDoor] && (
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
            <button
              type="button"
              className={styles.hintButton}
              onPointerDown={(e) => { e.stopPropagation(); captureScreenshot() }}
              aria-label="Take photo"
            >
              PHOTO
            </button>
          </>
        ) : (
          <>
            <span className={styles.hint}>WASD/ARROWS</span>
            <span className={styles.hint}>MOUSE LOOK</span>
            <span className={styles.hint}>E INTERACT</span>
            <span className={styles.hint}>P PHOTO</span>
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
      {/* Screenshot flash overlay — brief white pulse for capture feedback. */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#fff',
          opacity: flashOpacity,
          pointerEvents: 'none',
          transition: 'opacity 120ms ease-out',
          zIndex: 21,
        }}
      />
      {!sceneReady && (
        <div className={appStyles.loadingOverlay}>
          <span className={appStyles.loadingRing} role="img" aria-hidden="true" />
          <span className={appStyles.loadingText}>Loading</span>
        </div>
      )}
      {terminalOpen && (
        <TerminalInput
          onLoad={handleLoadVariation}
          onClose={() => setTerminalOpen(false)}
        />
      )}
    </div>
  )
}

// Sits inside the Canvas Suspense boundary. Once GLTF models have loaded
// (Suspense resolves) and Three.js has painted at least one frame, fires
// onReady so MuseumPage can drop the loading overlay covering the canvas.
function FirstFrameProbe({ onReady }: { onReady: () => void }) {
  const fired = useRef(false)
  useFrame(() => {
    if (fired.current) return
    fired.current = true
    requestAnimationFrame(() => onReady())
  })
  return null
}
