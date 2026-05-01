import { useMemo, useRef } from 'react'
import { Color, Group, MeshStandardMaterial, PointsMaterial } from 'three'
import { useFrame } from '@react-three/fiber'
import { useInventory } from '../data/inventory'
import { useSlots } from '../data/loadState'
import type { VariationNode } from '../data/variations'
import type { VisionTier } from '../data/settings'
import { NODE_SIZE } from './nodeAabb'

// One scan target inside Carcosa. Visual: a slowly-rotating, gently-
// bobbing octahedron, bright while available and dimmed once gathered
// (per spec: "canonized-entry nodes stay visible in Carcosa, but marked
// archived").
//
// Rendered through a data-driven loop in CarcosaScene; nodeAabb (in a
// separate file so this module exports only components) builds the
// per-node aim trigger from the same source of truth.
//
// Vision tier affects rendering only — the scan trigger uses nodeAabb,
// which is geometry-independent, so recording works at every tier
// (per spec: "the player can record nodes at any vision tier").

const SIZE = NODE_SIZE

export function Node({ node, tier }: { node: VariationNode; tier: VisionTier }) {
  const inv = useInventory()
  const slots = useSlots()
  const groupRef = useRef<Group>(null)
  const matRef = useRef<MeshStandardMaterial>(null)
  const pointsMatRef = useRef<PointsMaterial>(null)

  // A node reads as archived in two cases: the player's held cart has
  // captured it, OR a docked cart for this slug already records it.
  // The second case was missing — once a cart is docked the held-cart
  // check returns false, so previously-collected nodes lit back up as
  // un-collected when the player re-entered Carcosa.
  const archived = useMemo(() => {
    if (inv.cart && inv.cart.gathered[node.id]) return true
    for (const slot of Object.values(slots)) {
      if (slot.slug === node.slug && slot.gathered[node.id]) return true
    }
    return false
  }, [inv.cart, slots, node.id, node.slug])

  const baseColor = useMemo(() => new Color('#7cffa3'), [])
  // Archived nodes lerp toward this color. At tier 2 the world has a
  // bright white sky, so a near-black gray reads as "dimmed/done". At
  // visor tiers the world is wrapped in a black skybox, which would
  // hide a dark archived color — bump it to a desaturated slate so
  // captured nodes stay distinguishable from active ones (still
  // green) without competing for attention.
  const archivedColorTier2 = useMemo(() => new Color('#2c2e34'), [])
  const archivedColorVisor = useMemo(() => new Color('#7a96b0'), [])
  const archivedColor = tier === 2 ? archivedColorTier2 : archivedColorVisor

  useFrame(({ clock }, dt) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.6
      groupRef.current.position.y = node.position[1] + Math.sin(clock.elapsedTime * 1.4 + node.position[0] * 0.6) * 0.08
    }
    const target = archived ? archivedColor : baseColor
    if (matRef.current) {
      matRef.current.color.lerp(target, 0.08)
      matRef.current.emissive.lerp(target, 0.08)
      matRef.current.emissiveIntensity = archived ? 0.12 : 1.4
    }
    if (pointsMatRef.current) {
      pointsMatRef.current.color.lerp(target, 0.08)
    }
  })

  return (
    <group ref={groupRef} position={node.position}>
      {tier === 0 && (
        <points>
          <octahedronGeometry args={[SIZE / 2, 0]} />
          <pointsMaterial
            ref={pointsMatRef}
            color={baseColor}
            size={3}
            sizeAttenuation={false}
            toneMapped={false}
          />
        </points>
      )}
      {tier === 1 && (
        <mesh>
          <octahedronGeometry args={[SIZE / 2, 0]} />
          <meshStandardMaterial
            ref={matRef}
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={1.4}
            roughness={0.4}
            metalness={0.1}
            wireframe
            wireframeLinewidth={2}
          />
        </mesh>
      )}
      {tier === 2 && (
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
      )}
    </group>
  )
}
