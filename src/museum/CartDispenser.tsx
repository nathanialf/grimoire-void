import { useEffect, useMemo } from 'react'
import { CanvasTexture, NearestFilter, SRGBColorSpace } from 'three'
import { cartDispenserFixture } from './sceneConstants'
import { useInventory } from '../data/inventory'

// Free-standing blank-cartridge dispenser hung off the central pillar.
// Visual reacts to inventory state; the trigger that calls
// dispenseCart() lives in MuseumPage so the prompt UI reuses the
// existing Trigger system.

const STATUS_W_PX = 256
const STATUS_H_PX = 64

function paintStatus(ctx: CanvasRenderingContext2D, label: string, ready: boolean): void {
  ctx.fillStyle = '#040806'
  ctx.fillRect(0, 0, STATUS_W_PX, STATUS_H_PX)
  ctx.font = '900 32px "JetBrains Mono", ui-monospace, monospace'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillStyle = ready ? '#7cffa3' : '#ffb84d'
  ctx.fillText(label, STATUS_W_PX / 2, STATUS_H_PX / 2 + 1)
  // Scanline overlay so the panel matches the variant terminal.
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  for (let y = 0; y < STATUS_H_PX; y += 2) ctx.fillRect(0, y, STATUS_W_PX, 1)
}

export function CartDispenser() {
  const inv = useInventory()
  const f = cartDispenserFixture
  const { ctx, tex } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = STATUS_W_PX
    canvas.height = STATUS_H_PX
    const c = canvas.getContext('2d')!
    const t = new CanvasTexture(canvas)
    t.magFilter = NearestFilter
    t.minFilter = NearestFilter
    t.generateMipmaps = false
    t.colorSpace = SRGBColorSpace
    return { ctx: c, tex: t }
  }, [])
  const ready = inv.cart === null
  useEffect(() => {
    paintStatus(ctx, ready ? 'READY' : 'HELD', ready)
    tex.needsUpdate = true
  }, [ctx, tex, ready])

  const [cx, cy, cz] = f.center
  const [w, h, d] = f.size
  const frontZ = cz + d / 2

  // Status panel sits in the top third of the front face.
  const panelW = w * 0.78
  const panelH = 0.11
  const panelY = cy + h / 2 - 0.085

  // Cart-emerging slot in the bottom third.
  const slotW = w * 0.7
  const slotH = 0.065
  const slotY = cy - h / 2 + 0.075

  return (
    <group>
      {/* Body — same warm-off-white + emissive recipe as the museum's
          voxel pedestals; sits dead-center so it gets the maximum
          ~8× emissive baseline. */}
      <mesh position={[cx, cy, cz]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color="#e8e4dc"
          roughness={0.95}
          metalness={0}
          emissive="#1a1814"
          emissiveIntensity={8}
        />
      </mesh>
      {/* Status panel bezel — recessed dark so the green readout reads
          against it. */}
      <mesh position={[cx, panelY, frontZ - 0.004]}>
        <boxGeometry args={[panelW + 0.04, panelH + 0.04, 0.012]} />
        <meshStandardMaterial color="#0c0d0f" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[cx, panelY, frontZ - 0.002]}>
        <planeGeometry args={[panelW, panelH]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* Slot — simple recessed dark rectangle, no luminous insert. */}
      <mesh position={[cx, slotY, frontZ - 0.003]}>
        <boxGeometry args={[slotW + 0.05, slotH + 0.04, 0.014]} />
        <meshStandardMaterial color="#050505" roughness={0.95} metalness={0} />
      </mesh>
      {/* Caution chevron strip just below the slot. */}
      <mesh position={[cx, slotY - 0.06, frontZ - 0.002]}>
        <planeGeometry args={[panelW, 0.022]} />
        <meshBasicMaterial color="#ffb84d" toneMapped={false} />
      </mesh>
    </group>
  )
}
