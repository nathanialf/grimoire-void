import { CENTRAL_PEDESTAL } from './sceneConstants'

// Thin pillar dead-center of the room. Acts as the structural mount
// for the cart dispenser and tool rack — the dispenser/tool fixtures
// in sceneConstants protrude off its +Z face so the player approaching
// from the entry door sees them on the way to the carcosa door.
export function CentralPedestal() {
  const { centerX, centerZ, width, depth, height } = CENTRAL_PEDESTAL
  return (
    <group>
      {/* Pillar + footplate + cap all use the same warm-off-white +
          emissive recipe as the museum's pedestals so the column reads
          as the same fixture family. The pillar is dead-center,
          so its `pedestalEmissiveIntensity` works out to the maximum
          ~8× value (matches the inner pedestal slots). */}
      <mesh position={[centerX, height / 2, centerZ]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color="#e8e4dc"
          roughness={0.95}
          metalness={0}
          emissive="#1a1814"
          emissiveIntensity={8}
        />
      </mesh>
      <mesh position={[centerX, 0.015, centerZ]}>
        <boxGeometry args={[width * 1.4, 0.03, depth * 1.4]} />
        <meshStandardMaterial
          color="#e8e4dc"
          roughness={0.95}
          metalness={0}
          emissive="#1a1814"
          emissiveIntensity={8}
        />
      </mesh>
      <mesh position={[centerX, height + 0.012, centerZ]}>
        <boxGeometry args={[width * 1.15, 0.024, depth * 1.15]} />
        <meshStandardMaterial
          color="#e8e4dc"
          roughness={0.95}
          metalness={0}
          emissive="#1a1814"
          emissiveIntensity={8}
        />
      </mesh>
    </group>
  )
}
