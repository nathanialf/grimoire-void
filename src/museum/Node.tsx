import { useMemo, useRef } from 'react'
import { Color, Group, MeshStandardMaterial } from 'three'
import { useFrame } from '@react-three/fiber'
import { useInventory } from '../data/inventory'
import type { VariationNode } from '../data/variations'
import { NODE_SIZE } from './nodeAabb'

// One scan target inside Carcosa. Visual: a slowly-rotating, gently-
// bobbing octahedron, bright while available and dimmed once gathered
// (per spec: "canonized-entry nodes stay visible in Carcosa, but marked
// archived").
//
// Rendered through a data-driven loop in CarcosaScene; nodeAabb (in a
// separate file so this module exports only components) builds the
// per-node aim trigger from the same source of truth.

const SIZE = NODE_SIZE

export function Node({ node }: { node: VariationNode }) {
  const inv = useInventory()
  const groupRef = useRef<Group>(null)
  const matRef = useRef<MeshStandardMaterial>(null)

  const archived = !!(inv.cart && inv.cart.gathered[node.id])

  const baseColor = useMemo(() => new Color('#7cffa3'), [])
  const archivedColor = useMemo(() => new Color('#2c2e34'), [])

  useFrame(({ clock }, dt) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.6
      groupRef.current.position.y = node.position[1] + Math.sin(clock.elapsedTime * 1.4 + node.position[0] * 0.6) * 0.08
    }
    if (matRef.current) {
      const target = archived ? archivedColor : baseColor
      matRef.current.color.lerp(target, 0.08)
      matRef.current.emissive.lerp(target, 0.08)
      matRef.current.emissiveIntensity = archived ? 0.12 : 1.4
    }
  })

  return (
    <group ref={groupRef} position={node.position}>
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
