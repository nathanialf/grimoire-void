import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Matrix4, Quaternion, Vector3 } from 'three'
import { Scene } from '../museum/Scene'
import {
  CarcosaScene,
  returnPortalZone,
  GLIMPSE_EXPOSURE_MS,
  VISOR_SHUTTER_CLOSE_MS,
  VISOR_SHUTTER_HOLD_MS,
  VISOR_SHUTTER_OPEN_MS,
} from '../museum/CarcosaScene'
import { useVisionTier } from '../data/settings'
import {
  walkableRects,
  pedestalPositions,
  exitZone,
  carcosaDoorZone,
  EXIT_Z_POS,
  cartDispenserFixture,
  toolMountFixture,
  variantTerminalFixture,
  WALL_Z,
  wallFixtureAABB,
  fixtureBoxAABB,
  PEDESTAL_SIZE,
} from '../museum/sceneConstants'
import { DOOR_W, DOOR_H } from '../museum/frameTicker'
import { Controls, type InputState, type Trigger } from '../museum/Controls'
import { TouchControls } from '../museum/TouchControls'
import { Effects } from '../museum/Effects'
import { TerminalLog } from '../museum/TerminalLog'
import { DoorPrompt } from '../museum/DoorPrompt'
import { HeldCart, HeldTool } from '../museum/CartTool'
import { nodeAabb } from '../museum/nodeAabb'
import { VariantTerminalUI } from '../museum/VariantTerminalUI'
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
  clearSlot,
  setSlot,
  useSlots,
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

// Diegetic terminal focus: the camera flies to a fixed pose squarely in
// front of the variant terminal's screen and locks there so the dialog
// reads as the screen content. Screen plane sits just inside the bezel;
// viewing distance is ~0.9 m so the screen fills most of the frame
// without consuming it. Eye Y is matched to screen-center Y so the
// player sees the dialog head-on.
const TERMINAL_SCREEN_Z = WALL_Z + variantTerminalFixture.depth - 0.005
const TERMINAL_FOCUS_POS: [number, number, number] = [
  variantTerminalFixture.centerX,
  variantTerminalFixture.centerY,
  TERMINAL_SCREEN_Z + 0.9,
]
const TERMINAL_FOCUS_LOOKAT: [number, number, number] = [
  variantTerminalFixture.centerX,
  variantTerminalFixture.centerY,
  TERMINAL_SCREEN_Z,
]
const TERMINAL_TRANSITION_MS = 480

type TerminalPhase = 'closed' | 'enter' | 'open' | 'exit'

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
  const [terminalPhase, setTerminalPhase] = useState<TerminalPhase>('closed')
  const terminalLocked = terminalPhase !== 'closed'
  // Bumped each time the player physically dispenses a blank cart so
  // the held cart visual flies out of the dispenser. Stays at the
  // last bump value until the next dispense — partial-cart pickups
  // (which also flip inv.cart non-null) don't bump it, so they snap
  // into the loaded pose without replaying the animation.
  const [cartDispenseAt, setCartDispenseAt] = useState<number | null>(null)
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

  // Sensor-overload sequence fired every time the player enters Carcosa
  // (door entry, terminal load, etc). Timeline:
  //   0                              → exposure begins (full-tier glimpse)
  //   GLIMPSE_EXPOSURE_MS            → shutter starts closing over the view
  //   + VISOR_SHUTTER_CLOSE_MS       → shutter fully closed; tier swaps to
  //                                    storedTier behind it (glimpse off)
  //   + VISOR_SHUTTER_HOLD_MS        → shutter starts opening
  //   + VISOR_SHUTTER_OPEN_MS        → shutter fully open; degraded tier
  //                                    is now revealed
  // visorClosed drives the DOM shutter via CSS transform transitions.
  // visorGlimpse forces tier=2 inside CarcosaScene during exposure +
  // shutter-close (when the full-tier render is still what's behind the
  // closing shutter).
  const [visorGlimpse, setVisorGlimpse] = useState(false)
  const [visorClosed, setVisorClosed] = useState(false)
  const storedVisionTier = useVisionTier()
  // Whether the suit visor is currently restricting the player's view —
  // i.e. the rendered tier in Carcosa is below full. Drives HUD chrome
  // (hints / prompts) so it pops against the dark visor view at degraded
  // tiers and stays subtle (museum-style) when the player has full
  // sensors. visorGlimpse forces full-tier briefly on entry, so during
  // the exposure window the HUD reads as "visor inactive" too.
  const visorActive =
    activeScene === 'carcosa' && !visorGlimpse && storedVisionTier !== 2
  useEffect(() => {
    // No sensor overload to recover from at full sensor capability —
    // the visor sequence only fires when the player's stored tier is
    // degraded.
    if (activeScene !== 'carcosa' || storedVisionTier === 2) {
      setVisorGlimpse(false)
      setVisorClosed(false)
      return
    }
    setVisorGlimpse(true)
    setVisorClosed(false)
    const closeAt = GLIMPSE_EXPOSURE_MS
    const swapAt = closeAt + VISOR_SHUTTER_CLOSE_MS
    const openAt = swapAt + VISOR_SHUTTER_HOLD_MS
    const t1 = setTimeout(() => setVisorClosed(true), closeAt)
    const t2 = setTimeout(() => setVisorGlimpse(false), swapAt)
    const t3 = setTimeout(() => setVisorClosed(false), openAt)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [activeScene, activeVariationKey, storedVisionTier])

  // Held inventory lives in module state (intentionally — see
  // inventory.ts), which means it survives a browser-back into the
  // museum. Re-entering the museum is a "leaving" event by the same
  // logic that wipes on refresh / EXIT / derez, so reset on mount so
  // the player always starts the run with the aperture racked and no
  // cart in hand.
  useEffect(() => {
    derezInventory()
  }, [])

  // Release pointer lock while the variant terminal is open, and
  // re-engage it the moment the player leaves the terminal so they
  // don't have to click to regain look-control. drei's
  // PointerLockControls.disconnect() only removes its listeners — it
  // does NOT exit the browser's pointer lock — so without the explicit
  // exit the cursor stays hidden and clicks on the dialog route to the
  // locked canvas instead. The re-lock leans on the transient
  // activation from the closing gesture (Esc, ×-click, Enter, or
  // known-row click) which all qualify as user gestures, so the
  // browser allows requestPointerLock for ~1–3 seconds afterward.
  // Touch devices skip both branches.
  const wasTerminalLocked = useRef(false)
  useEffect(() => {
    if (touch) return
    const prev = wasTerminalLocked.current
    wasTerminalLocked.current = terminalLocked
    if (terminalLocked && document.pointerLockElement) {
      document.exitPointerLock()
      return
    }
    if (prev && !terminalLocked) {
      const canvas = canvasContainerRef.current?.querySelector('canvas')
      if (canvas && document.pointerLockElement !== canvas) {
        const req = (canvas as HTMLElement).requestPointerLock?.()
        if (req && typeof (req as Promise<void>).catch === 'function') {
          (req as Promise<void>).catch(() => {})
        }
      }
    }
  }, [terminalLocked, touch])

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
  const slotsState = useSlots()

  const handleLoadVariation = useCallback((key: string) => {
    setActiveVariationKey(key)
    // Skip the camera-back animation: the scene swap relocates us to
    // CARCOSA_SPAWN anyway, and the swap fade hides the snap.
    setTerminalPhase('closed')
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
          onActivate: () => { setTerminalPhase('enter') },
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
          onActivate: () => {
            if (dispenseCart()) setCartDispenseAt(performance.now())
          },
          label: 'DISPENSE CART',
          aim: { min: aabb.min, max: aabb.max, maxDist: 2.4 },
        })
      }
      // Tool rack — only present until equipped.
      if (!inv.tool.equipped) {
        const aabb = fixtureBoxAABB(toolMountFixture)
        triggers.push({
          zone: { minX: aabb.min[0], maxX: aabb.max[0], minZ: aabb.min[2], maxZ: aabb.max[2] },
          onActivate: () => { pickUpTool() },
          label: 'PICK UP APERTURE',
          aim: { min: aabb.min, max: aabb.max, maxDist: 2.4 },
        })
      }

      // Per-slot triggers. Pedestals are anonymous: empty slots accept
      // any held cart with a slug; partial slots surface a RETRIEVE
      // when the player has no cart; complete slots are permanent and
      // contribute no trigger.
      //
      // Completion is determined by the active variation's node set
      // for the cart's slug — every authored node for that slug must
      // be in `gathered`. Slugs with nodes spread across multiple
      // variations require visiting each one to complete.
      const variationNodeIdsBySlug = new Map<string, string[]>()
      for (const n of activeVariation.nodes) {
        const list = variationNodeIdsBySlug.get(n.slug) ?? []
        list.push(n.id)
        variationNodeIdsBySlug.set(n.slug, list)
      }
      for (let i = 0; i < pedestalPositions.length; i++) {
        const [px, pz] = pedestalPositions[i]
        const half = PEDESTAL_SIZE / 2
        const aabb = {
          min: [px - half, 0, pz - half] as [number, number, number],
          max: [px + half, PEDESTAL_SIZE + 0.6, pz + half] as [number, number, number],
        }
        const zone = { minX: aabb.min[0], maxX: aabb.max[0], minZ: aabb.min[2], maxZ: aabb.max[2] }
        const seated = slotsState[i]

        if (seated && seated.state === 'complete') continue

        if (!seated && inv.cart && inv.cart.slug) {
          // Empty slot + held cart → DOCK trigger. Any pedestal accepts
          // any cart; the slug is set on the slot at dock time.
          const cartSlug = inv.cart.slug
          const expected = variationNodeIdsBySlug.get(cartSlug) ?? []
          const cart = inv.cart
          const allGathered = expected.length > 0 && expected.every((id) => cart.gathered[id])
          triggers.push({
            zone,
            onActivate: () => {
              const docked = dockCart()
              if (!docked || !docked.slug) return
              const gathered: Record<string, true> = {}
              for (const [k, v] of Object.entries(docked.gathered)) if (v) gathered[k] = true
              setSlot(i, docked.slug, allGathered ? 'complete' : 'partial', gathered)
            },
            label: 'INSERT',
            aim: { min: aabb.min, max: aabb.max, maxDist: 3.5 },
          })
        } else if (seated && seated.state === 'partial' && !inv.cart) {
          // Partial slot + empty hands → RETRIEVE. Per cart-lifecycle
          // discussion: retrieving the partial cart frees the slot so
          // a cart can be re-docked anywhere later. The wiki entry is
          // hidden while the cart is in-hand (no slot holds it).
          triggers.push({
            zone,
            onActivate: () => {
              const ok = pickUpPartialCart(seated.slug, seated.gathered)
              if (ok) clearSlot(i)
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
      // Slugs currently seated in any pedestal slot. A node whose slug
      // is in the seated set can only be scanned if the held cart is
      // already bound to that exact slug (i.e. the player retrieved
      // the partial cart from its pedestal and is finishing it).
      // Otherwise scanning would create a duplicate cart for one
      // canonised slug — invariant: one slug, one cart, one slot.
      const seatedSlugs = new Set(Object.values(slotsState).map((s) => s.slug))
      for (const n of activeVariation.nodes) {
        const alreadyGathered = !!(cart && cart.gathered[n.id])
        if (alreadyGathered) continue
        // Held cart isn't bound to this slug AND the slug already
        // exists in a slot → block. Player either has to retrieve the
        // partial cart from its pedestal, or the slug is permanently
        // canonised (complete) and can't be re-scanned.
        const cartIsBoundToThisSlug = !!(cart && cart.slug === n.slug)
        if (seatedSlugs.has(n.slug) && !cartIsBoundToThisSlug) continue
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
  }, [activeScene, inv, slotsState, activeVariation])

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
            <CarcosaScene variation={activeVariation} glimpse={visorGlimpse} />
          </group>
          {/* Held tool sits at top-level so it persists across scene
              swaps without re-mounting (which would tear down its
              camera-attachment effect). */}
          <HeldTool />
          <HeldCart dispenseAt={cartDispenseAt} />
          <TerminalFocus
            phase={terminalPhase}
            focusPos={TERMINAL_FOCUS_POS}
            focusLookAt={TERMINAL_FOCUS_LOOKAT}
            durationMs={TERMINAL_TRANSITION_MS}
            onArrived={() => setTerminalPhase('open')}
            onExited={() => setTerminalPhase('closed')}
          />
          {/* Variant terminal dialog. Rendered as in-scene meshes on
              the CRT screen plane so the EffectComposer post-FX
              (bloom, halation, scanlines, CA, vignette) hits it like
              every other scene element — phosphor glow comes from
              real bloom on emissive `<Text>`, not CSS text-shadow.
              Mounted only while phase is 'open' so the dialog's
              keydown listener actually unmounts on teleport — leaving
              it mounted with a `visible` flag would let the listener
              keep capturing keystrokes into the input even after we've
              swapped scenes to Carcosa. */}
          {activeScene === 'museum' && terminalPhase === 'open' && (
            <VariantTerminalUI
              position={[
                variantTerminalFixture.centerX,
                variantTerminalFixture.centerY,
                TERMINAL_SCREEN_Z + 0.003,
              ]}
              onLoad={handleLoadVariation}
              onClose={() => setTerminalPhase('exit')}
              touch={touch}
            />
          )}
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
          locked={isExiting || terminalLocked}
        />
      </Canvas>
      </div>
      <TerminalLog ms={msLeft} />
      {/* TouchControls renders a full-screen .touchLayer (pointer-events:auto)
          to capture the joystick + look-swipe gestures. While the variant
          terminal dialog is open it would swallow every tap before the
          canvas could raycast to a list row, ENTER, or × — so unmount it
          for the duration of the dialog. Player input is locked anyway. */}
      {touch && !terminalLocked && <TouchControls input={inputRef} />}
      {/* Guard against the index briefly outliving its trigger: when an
          aim trigger removes itself in response to its own onActivate
          (dispenser, tool rack, demo node), the doors array shrinks
          before Controls' next-frame update clears `activeDoor`. The
          stale index would dereference `undefined` without this check. */}
      {activeDoor !== null && doors[activeDoor] && !terminalLocked && !isExiting && (
        <DoorPrompt
          label={doors[activeDoor].label ?? 'OPEN'}
          touch={touch}
          carcosa={activeScene === 'carcosa' && !visorActive}
          onActivate={doors[activeDoor].onActivate}
        />
      )}
      <div className={activeScene === 'carcosa' && !visorActive ? styles.cursorCarcosa : styles.cursor} />
      <div className={styles.hintRow}>
        {(() => {
          const inCarcosa = activeScene === 'carcosa'
          // Visor active = full-vision-tier glimpse or stored tier 2:
          // HUD pops in the museum's bright black-on-accent chips.
          // Visor inactive (degraded tier in Carcosa) = the dimmer
          // white-on-black Carcosa chip so it doesn't compete with the
          // sparse void rendering.
          const useCarcosaChip = inCarcosa && !visorActive
          const hintCls = useCarcosaChip ? styles.hintCarcosa : styles.hint
          const hintBtnCls = useCarcosaChip ? styles.hintButtonCarcosa : styles.hintButton
          return touch ? (
            <>
              <span className={hintCls}>LEFT MOVE</span>
              <span className={hintCls}>RIGHT LOOK</span>
              <button
                type="button"
                className={hintBtnCls}
                onPointerDown={(e) => { e.stopPropagation(); captureScreenshot() }}
                aria-label="Take photo"
              >
                PHOTO
              </button>
            </>
          ) : (
            <>
              <span className={hintCls}>WASD/ARROWS</span>
              <span className={hintCls}>MOUSE LOOK</span>
              <span className={hintCls}>E INTERACT</span>
              <span className={hintCls}>P PHOTO</span>
            </>
          )
        })()}
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
      {/* Sensor-overload visor: two black halves meet at the horizon line
          when the suit shutters down at the end of the entry exposure,
          then retract to reveal the (degraded) tier underneath. Hidden
          unless the player is actively in Carcosa so the museum view
          can't accidentally show shutter chrome. */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: 0,
          height: '50%',
          background: '#000',
          transform: visorClosed ? 'translateY(0)' : 'translateY(-100%)',
          transition: `transform ${visorClosed ? VISOR_SHUTTER_CLOSE_MS : VISOR_SHUTTER_OPEN_MS}ms ease-${visorClosed ? 'in' : 'out'}`,
          pointerEvents: 'none',
          zIndex: 22,
          display: activeScene === 'carcosa' ? 'block' : 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: '50%',
          background: '#000',
          transform: visorClosed ? 'translateY(0)' : 'translateY(100%)',
          transition: `transform ${visorClosed ? VISOR_SHUTTER_CLOSE_MS : VISOR_SHUTTER_OPEN_MS}ms ease-${visorClosed ? 'in' : 'out'}`,
          pointerEvents: 'none',
          zIndex: 22,
          display: activeScene === 'carcosa' ? 'block' : 'none',
        }}
      />
      {/* Sensor-overload warning shown for the entire pre-shutter window
          of the visor sequence — i.e. while the player is still seeing
          the full-fidelity glimpse but the suit is about to drop them
          to a degraded tier. Hides the moment the shutter swap fires
          (visorGlimpse → false). Sits above the shutter so the message
          is the last thing visible before the world goes dark. */}
      {activeScene === 'carcosa' && visorGlimpse && (
        <div
          className={styles.visorWarningPulse}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            textTransform: 'uppercase',
            textShadow: '0 0 8px #000, 0 0 2px #000',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 23,
          }}
        >
          <span style={{ fontSize: '4rem', lineHeight: 1 }} aria-hidden="true">⚠</span>
          <span style={{ fontSize: '1.25rem', letterSpacing: '0.4em', textIndent: '0.4em' }}>
            Danger — Sensor Overload Imminent
          </span>
        </div>
      )}
      {!sceneReady && (
        <div className={appStyles.loadingOverlay}>
          <span className={appStyles.loadingRing} role="img" aria-hidden="true" />
          <span className={appStyles.loadingText}>Loading</span>
        </div>
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

// Drives the diegetic terminal-focus camera flight. On `enter`, snapshots
// the player's current pose and animates the camera to the focus pose
// (in front of the screen, looking head-on); on `exit`, animates back
// to the snapshotted pose. Phase transitions are owned by the parent —
// this component just executes the flight and reports completion via
// onArrived / onExited so the parent can step the state machine
// forward. Controls is locked the whole time so player input doesn't
// fight the animation.
interface TerminalFocusProps {
  phase: TerminalPhase
  focusPos: [number, number, number]
  focusLookAt: [number, number, number]
  durationMs: number
  onArrived: () => void
  onExited: () => void
}

function TerminalFocus({ phase, focusPos, focusLookAt, durationMs, onArrived, onExited }: TerminalFocusProps) {
  const { camera } = useThree()
  const prevPoseRef = useRef<{ pos: Vector3; quat: Quaternion } | null>(null)
  const animRef = useRef<{
    kind: 'enter' | 'exit'
    startTime: number
    startPos: Vector3
    startQuat: Quaternion
    endPos: Vector3
    endQuat: Quaternion
  } | null>(null)
  const onArrivedRef = useRef(onArrived)
  const onExitedRef = useRef(onExited)
  useEffect(() => { onArrivedRef.current = onArrived }, [onArrived])
  useEffect(() => { onExitedRef.current = onExited }, [onExited])

  // Reusable scratch buffers for computing the focus quaternion. Use
  // Matrix4.lookAt directly (camera convention: -Z points at target) —
  // Object3D.lookAt on a plain object instead orients +Z toward the
  // target, which would 180°-flip the camera.
  const helperMat = useMemo(() => new Matrix4(), [])
  const helperPos = useMemo(() => new Vector3(), [])
  const helperLook = useMemo(() => new Vector3(), [])
  const tmpQuat = useMemo(() => new Quaternion(), [])

  useEffect(() => {
    if (phase === 'enter') {
      const startPos = camera.position.clone()
      const startQuat = camera.quaternion.clone()
      prevPoseRef.current = { pos: startPos.clone(), quat: startQuat.clone() }
      const endPos = new Vector3(...focusPos)
      helperPos.copy(endPos)
      helperLook.set(focusLookAt[0], focusLookAt[1], focusLookAt[2])
      helperMat.lookAt(helperPos, helperLook, camera.up)
      const endQuat = new Quaternion().setFromRotationMatrix(helperMat)
      animRef.current = { kind: 'enter', startTime: performance.now(), startPos, startQuat, endPos, endQuat }
    } else if (phase === 'exit') {
      const prev = prevPoseRef.current
      if (!prev) {
        // No snapshot to return to — just complete immediately.
        onExitedRef.current()
        return
      }
      const startPos = camera.position.clone()
      const startQuat = camera.quaternion.clone()
      animRef.current = {
        kind: 'exit',
        startTime: performance.now(),
        startPos,
        startQuat,
        endPos: prev.pos.clone(),
        endQuat: prev.quat.clone(),
      }
    } else if (phase === 'closed') {
      // External cancellation (scene swap from handleLoadVariation).
      // Drop any in-flight animation; the new spawn will re-pose the
      // camera via Controls' spawn effect.
      animRef.current = null
      prevPoseRef.current = null
    }
  }, [phase, camera, focusPos, focusLookAt, helperMat, helperPos, helperLook])

  useFrame(() => {
    const a = animRef.current
    if (!a) return
    const elapsed = performance.now() - a.startTime
    const u = Math.min(1, elapsed / durationMs)
    // Ease-in-out cubic so the flight starts gentle, accelerates, and
    // settles cleanly at the endpoint.
    const eased = u < 0.5
      ? 4 * u * u * u
      : 1 - Math.pow(-2 * u + 2, 3) / 2
    camera.position.lerpVectors(a.startPos, a.endPos, eased)
    tmpQuat.copy(a.startQuat).slerp(a.endQuat, eased)
    camera.quaternion.copy(tmpQuat)
    if (u >= 1) {
      const ended = a.kind
      animRef.current = null
      if (ended === 'enter') onArrivedRef.current()
      else onExitedRef.current()
    }
  })

  return null
}
