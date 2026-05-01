import { useEffect, useMemo } from 'react'
import { CanvasTexture, NearestFilter, SRGBColorSpace } from 'three'
import { cartDispenserFixture, cartDispenserRotationY } from './sceneConstants'
import { useInventory } from '../data/inventory'

// Wall-mounted blank-cartridge dispenser on the +X (east) wall, next to
// the recording tool. Visual reacts to inventory state; the trigger that
// calls dispenseCart() lives in MuseumPage so the prompt UI reuses the
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

  // Local frame (back of body at z = -bodyD/2, front at +bodyD/2). The
  // wrapping group at f.center applies the world rotation so the body
  // faces -X on the east wall.
  const bodyW = 0.5
  const bodyH = 0.42
  const bodyD = 0.22
  const frontZ = bodyD / 2

  const panelW = bodyW * 0.78
  const panelH = 0.11
  const panelY = bodyH / 2 - 0.085

  const slotW = bodyW * 0.7
  const slotH = 0.065
  const slotY = -bodyH / 2 + 0.075

  return (
    <group position={f.center} rotation={[0, cartDispenserRotationY, 0]}>
      {/* Body — same warm-off-white + emissive recipe as the museum's
          pedestals; sits dead-center so it gets the maximum
          ~8× emissive baseline. */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[bodyW, bodyH, bodyD]} />
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
      <mesh position={[0, panelY, frontZ - 0.004]}>
        <boxGeometry args={[panelW + 0.04, panelH + 0.04, 0.012]} />
        <meshStandardMaterial color="#0c0d0f" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, panelY, frontZ - 0.002]}>
        <planeGeometry args={[panelW, panelH]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* Slot — simple recessed dark rectangle, no luminous insert. */}
      <mesh position={[0, slotY, frontZ - 0.003]}>
        <boxGeometry args={[slotW + 0.05, slotH + 0.04, 0.014]} />
        <meshStandardMaterial color="#050505" roughness={0.95} metalness={0} />
      </mesh>
      {/* Caution chevron strip just below the slot. */}
      <mesh position={[0, slotY - 0.06, frontZ - 0.002]}>
        <planeGeometry args={[panelW, 0.022]} />
        <meshBasicMaterial color="#ffb84d" toneMapped={false} />
      </mesh>
    </group>
  )
}
