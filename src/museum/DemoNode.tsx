import { useMemo, useRef } from 'react'
import { Color, Group, MeshStandardMaterial } from 'three'
import { useFrame } from '@react-three/fiber'
import { useInventory } from '../data/inventory'

// One canonical scan target inside Carcosa, used as a smoke-test fixture
// for the recording loop. Real node authoring (multiple nodes per cart,
// per-variation placement, vision-tier visibility) is deferred. This
// node is bound to a placeholder slug+id matching one of the existing
// pedestal docs, so the scope reads correctly when scanned.

export const DEMO_NODE_ID = 'demo-node-001'
export const DEMO_NODE_SLUG = 'aria-vex'

const POSITION: [number, number, number] = [3, 1.4, -3]
const SIZE = 0.3

// Exposed so MuseumPage can build the aim trigger AABB from a single
// source of truth.
export const demoNodeAabb = {
  min: [POSITION[0] - SIZE / 2, POSITION[1] - SIZE / 2, POSITION[2] - SIZE / 2] as [number, number, number],
  max: [POSITION[0] + SIZE / 2, POSITION[1] + SIZE / 2, POSITION[2] + SIZE / 2] as [number, number, number],
}

export function DemoNode() {
  const inv = useInventory()
  const groupRef = useRef<Group>(null)
  const matRef = useRef<MeshStandardMaterial>(null)

  // Archived = the held cart already has this node gathered.
  const archived = !!(inv.cart && inv.cart.gathered[DEMO_NODE_ID])

  const baseColor = useMemo(() => new Color('#7cffa3'), [])
  const archivedColor = useMemo(() => new Color('#2c2e34'), [])

  useFrame(({ clock }, dt) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.6
      groupRef.current.position.y = POSITION[1] + Math.sin(clock.elapsedTime * 1.4) * 0.08
    }
    if (matRef.current) {
      const target = archived ? archivedColor : baseColor
      matRef.current.color.lerp(target, 0.08)
      matRef.current.emissive.lerp(target, 0.08)
      matRef.current.emissiveIntensity = archived ? 0.12 : 1.4
    }
  })

  return (
    <group ref={groupRef} position={POSITION}>
      <mesh>
        <octahedronGeometry args={[SIZE / 2, 0]} />
        <meshStandardMaterial
          ref={matRef}
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={1.4}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
    </group>
  )
}
