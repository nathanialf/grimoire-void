import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { Vector3, MathUtils } from 'three'
import { clampToWalkable, type Rect } from './sceneConstants'

export interface InputState {
  forward: number
  strafe: number
  yaw: number
  pitch: number
}

export interface Trigger {
  zone: Rect
  onActivate: () => void
  label?: string
  // Optional unit vector (xz) pointing outward through the door. If set, the
  // trigger only activates when the camera is facing roughly this direction
  // (dot >= FACING_DOT_THRESHOLD) so players don't trip doors while looking
  // away from them.
  facing?: [number, number]
  // If true, fire onActivate the moment the player walks into the zone
  // (facing the door) instead of showing a prompt + waiting for E/tap.
  instant?: boolean
  // If set, replaces the zone+facing presence check with a 3D camera-forward
  // ray-AABB test. Trigger is active when the reticle hits the box within
  // maxDist. Used for the EXIT door so the player can engage it from across
  // the room by aiming at it.
  aim?: {
    min: [number, number, number]
    max: [number, number, number]
    maxDist: number
  }
}

const FACING_DOT_THRESHOLD = 0.5

// Slab method: does the ray (origin O, direction D) hit the AABB within
// [0, maxDist]? Direction need not be unit-length, but maxDist is in
// direction-units (we pass a unit-length forward vector, so it's metres).
function rayHitsBox(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  minx: number, miny: number, minz: number,
  maxx: number, maxy: number, maxz: number,
  maxDist: number,
): boolean {
  let tmin = 0
  let tmax = maxDist
  const slab = (o: number, d: number, lo: number, hi: number): boolean => {
    if (Math.abs(d) < 1e-8) return o >= lo && o <= hi
    const inv = 1 / d
    let t1 = (lo - o) * inv
    let t2 = (hi - o) * inv
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp }
    if (t1 > tmin) tmin = t1
    if (t2 < tmax) tmax = t2
    return tmin <= tmax
  }
  if (!slab(ox, dx, minx, maxx)) return false
  if (!slab(oy, dy, miny, maxy)) return false
  if (!slab(oz, dz, minz, maxz)) return false
  return true
}

export interface ControlsProps {
  input: React.MutableRefObject<InputState>
  touch: boolean
  triggers: Trigger[]
  walkableRects: Rect[]
  pedestalPositions: [number, number][]
  spawn?: [number, number, number]
  spawnLookAt?: [number, number, number]
  onActiveTriggerChange?: (index: number | null) => void
}

const MOVE_SPEED = 2.5
const PEDESTAL_RADIUS = 0.8

export function Controls({
  input,
  touch,
  triggers,
  walkableRects,
  pedestalPositions,
  spawn = [0, 1.6, 5],
  spawnLookAt = [0, 1.6, 0],
  onActiveTriggerChange,
}: ControlsProps) {
  const { camera } = useThree()
  const velocity = useRef(new Vector3())
  const forward = useRef(new Vector3())
  const forward3 = useRef(new Vector3())
  const right = useRef(new Vector3())
  const activeRef = useRef<number | null>(null)
  const wasInsideInstantRef = useRef<Set<number>>(new Set())
  const triggersRef = useRef(triggers)
  useEffect(() => { triggersRef.current = triggers }, [triggers])
  const onActiveTriggerChangeRef = useRef(onActiveTriggerChange)
  useEffect(() => { onActiveTriggerChangeRef.current = onActiveTriggerChange }, [onActiveTriggerChange])

  // 'E' key activates the currently-inside trigger (desktop only — mobile
  // uses the DoorPrompt button directly).
  useEffect(() => {
    if (touch) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return
      const i = activeRef.current
      if (i === null) return
      triggersRef.current[i]?.onActivate()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [touch])

  // Initialise camera pose. Use YXZ Euler order so yaw (Y) + pitch (X) never
  // introduce roll on the Z axis — otherwise touch swipes skew the horizon.
  // Depend on the array elements (not the arrays themselves) so a fresh
  // literal from the parent render doesn't re-snap the camera to spawn every
  // frame, which would lock movement and look.
  const sx = spawn[0], sy = spawn[1], sz = spawn[2]
  const lx = spawnLookAt[0], ly = spawnLookAt[1], lz = spawnLookAt[2]
  useEffect(() => {
    camera.rotation.order = 'YXZ'
    camera.position.set(sx, sy, sz)
    camera.lookAt(lx, ly, lz)
    camera.rotation.z = 0
  }, [camera, sx, sy, sz, lx, ly, lz])

  // Desktop WASD keyboard
  useEffect(() => {
    if (touch) return
    const keys = new Set<string>()
    const down = (e: KeyboardEvent) => keys.add(e.code)
    const up = (e: KeyboardEvent) => keys.delete(e.code)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    const poll = setInterval(() => {
      let f = 0
      let s = 0
      if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1
      if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1
      if (keys.has('KeyD') || keys.has('ArrowRight')) s += 1
      if (keys.has('KeyA') || keys.has('ArrowLeft')) s -= 1
      input.current.forward = f
      input.current.strafe = s
    }, 16)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      clearInterval(poll)
    }
  }, [touch, input])

  useFrame((_, dt) => {
    camera.getWorldDirection(forward3.current)
    forward.current.copy(forward3.current)
    forward.current.y = 0
    forward.current.normalize()
    right.current.crossVectors(forward.current, camera.up).normalize()

    velocity.current.set(0, 0, 0)
    velocity.current.addScaledVector(forward.current, input.current.forward * MOVE_SPEED * dt)
    velocity.current.addScaledVector(right.current, input.current.strafe * MOVE_SPEED * dt)

    const next = camera.position.clone().add(velocity.current)

    // Touch yaw/pitch — swipe deltas are already angle increments (radians), so
    // apply them in full each frame. Scaling by dt made long swipes feel sluggish.
    if (touch) {
      camera.rotation.y -= input.current.yaw
      const pitch = MathUtils.clamp(camera.rotation.x - input.current.pitch, -Math.PI / 3, Math.PI / 3)
      camera.rotation.x = pitch
      camera.rotation.z = 0
      input.current.yaw = 0
      input.current.pitch = 0
    }

    // Walkable-rect clamp with axis-separated wall slide.
    const clamped = clampToWalkable(
      { x: next.x, z: next.z },
      { x: camera.position.x, z: camera.position.z },
      walkableRects,
    )
    next.x = clamped.x
    next.z = clamped.z
    next.y = 1.6

    // Push out of pedestals
    for (const [px, pz] of pedestalPositions) {
      const dx = next.x - px
      const dz = next.z - pz
      const d = Math.hypot(dx, dz)
      if (d < PEDESTAL_RADIUS) {
        const push = (PEDESTAL_RADIUS - d) / Math.max(d, 0.0001)
        next.x += dx * push
        next.z += dz * push
      }
    }

    camera.position.copy(next)

    // Presence detection. Non-instant triggers report an active index for the
    // E-prompt UI; instant triggers fire onActivate on walk-in (rising-edge
    // crossing of the zone boundary while facing the door).
    let active: number | null = null
    const stillInsideInstant = new Set<number>()
    for (let i = 0; i < triggers.length; i++) {
      const t = triggers[i]
      if (t.aim) {
        if (active !== null) continue
        const a = t.aim
        const hit = rayHitsBox(
          camera.position.x, camera.position.y, camera.position.z,
          forward3.current.x, forward3.current.y, forward3.current.z,
          a.min[0], a.min[1], a.min[2],
          a.max[0], a.max[1], a.max[2],
          a.maxDist,
        )
        if (hit) active = i
        continue
      }
      const z = t.zone
      const inside = next.x >= z.minX && next.x <= z.maxX && next.z >= z.minZ && next.z <= z.maxZ
      if (!inside) continue
      let facingOk = true
      if (t.facing) {
        const fx = forward.current.x
        const fz = forward.current.z
        const flen = Math.hypot(fx, fz) || 1
        const dot = (fx / flen) * t.facing[0] + (fz / flen) * t.facing[1]
        facingOk = dot >= FACING_DOT_THRESHOLD
      }
      if (t.instant) {
        stillInsideInstant.add(i)
        if (facingOk && !wasInsideInstantRef.current.has(i)) {
          t.onActivate()
        }
      } else if (facingOk && active === null) {
        active = i
      }
    }
    wasInsideInstantRef.current = stillInsideInstant
    if (active !== activeRef.current) {
      activeRef.current = active
      onActiveTriggerChangeRef.current?.(active)
    }
  })

  if (touch) return null
  return <PointerLockControls />
}
