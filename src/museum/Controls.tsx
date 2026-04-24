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
  onEnter: () => void
}

export interface ControlsProps {
  input: React.MutableRefObject<InputState>
  touch: boolean
  triggers: Trigger[]
  walkableRects: Rect[]
  pedestalPositions: [number, number][]
  spawn?: [number, number, number]
  spawnLookAt?: [number, number, number]
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
}: ControlsProps) {
  const { camera } = useThree()
  const velocity = useRef(new Vector3())
  const forward = useRef(new Vector3())
  const right = useRef(new Vector3())
  const triggeredRef = useRef<Set<number>>(new Set())

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
    camera.getWorldDirection(forward.current)
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

    // Per-trigger entry detection (each fires once per session).
    for (let i = 0; i < triggers.length; i++) {
      if (triggeredRef.current.has(i)) continue
      const z = triggers[i].zone
      if (next.x >= z.minX && next.x <= z.maxX && next.z >= z.minZ && next.z <= z.maxZ) {
        triggeredRef.current.add(i)
        triggers[i].onEnter()
      }
    }
  })

  if (touch) return null
  return <PointerLockControls />
}
