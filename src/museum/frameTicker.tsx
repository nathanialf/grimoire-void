import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping } from 'three'
import { useFrame } from '@react-three/fiber'

export const DOOR_W = 1.2
export const DOOR_H = 2.2
export const DOOR_CY = 1.1
export const FRAME_W = 0.12

export function makeDebugTickerCanvas(): { canvas: HTMLCanvasElement } {
  const msg = 'ATTACH █ '
  const font = '900 44px "JetBrains Mono", ui-monospace, monospace'
  const h = 64
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = font
  const msgWidth = Math.ceil(measure.measureText(msg).width)
  const copies = 8
  const w = msgWidth * copies

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.font = font
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < copies; i++) {
    ctx.fillText(msg, i * msgWidth, h / 2)
  }
  return { canvas }
}

export interface FrameTickerProps {
  canvas: HTMLCanvasElement
  centerX: number
  centerY: number
  centerZ: number
  rotationY: number
  // Outward (toward viewer) offset along the wall normal axis.
  outwardOffset: number
  // World axis the strip width lies along: 'x' for +/-Z-facing walls,
  // 'z' for +/-X-facing walls.
  wallAxis: 'x' | 'z'
  cornerColor?: string
  // Flip ONLY the left/right side strips' scroll direction. Needed when the
  // door's normal is mirrored relative to the museum exit door — top/bottom
  // strips run along the same world axis in either case so they don't need
  // flipping, but the side strips reverse with the world mirror.
  mirrorSides?: boolean
}

export function FrameTicker({
  canvas,
  centerX,
  centerY,
  centerZ,
  rotationY,
  outwardOffset,
  wallAxis,
  cornerColor = '#ffffff',
  mirrorSides = false,
}: FrameTickerProps) {
  // Each strip gets its own CanvasTexture clone so rotation / repeat / offset
  // can differ per strip. Rotation orientation traces a clockwise drum around
  // the frame: top upright, right top-down, bottom upside-down, left bottom-up.
  // When the door is mirrored relative to the museum exit (e.g. portals
  // facing +Z), the side strips also need their texture rotations flipped by
  // π so the text reads "upright" in the viewer's frame instead of inverted.
  const textures = useMemo(() => {
    const make = (rotation: number) => {
      const t = new CanvasTexture(canvas)
      t.wrapS = RepeatWrapping
      t.wrapT = RepeatWrapping
      t.anisotropy = 4
      t.center.set(0.5, 0.5)
      t.rotation = rotation
      return t
    }
    const sideFlip = mirrorSides ? Math.PI : 0
    return {
      top: make(0),
      right: make(Math.PI / 2 + sideFlip),
      bottom: make(Math.PI),
      left: make(-Math.PI / 2 + sideFlip),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, mirrorSides])

  useFrame((_, dt) => {
    const d = dt * 0.05
    // Side strips don't need their scroll direction negated when mirrorSides
    // is on — the +π texture rotation already flips what "advancing offset.x"
    // looks like in the viewer's frame, so a single positive advance keeps
    // the perimeter circulation visually consistent across all four strips.
    textures.top.offset.x = (textures.top.offset.x + d) % 1
    textures.right.offset.x = (textures.right.offset.x + d) % 1
    textures.bottom.offset.x = (textures.bottom.offset.x + d) % 1
    textures.left.offset.x = (textures.left.offset.x + d) % 1
  })

  const canvasAspect = canvas.width / canvas.height
  const topAspect = (DOOR_W + 2 * FRAME_W) / FRAME_W
  const sideAspect = DOOR_H / FRAME_W
  textures.top.repeat.x = topAspect / canvasAspect
  textures.bottom.repeat.x = topAspect / canvasAspect
  textures.left.repeat.x = sideAspect / canvasAspect
  textures.right.repeat.x = sideAspect / canvasAspect

  const outerLeft = -DOOR_W / 2 - FRAME_W / 2
  const outerRight = DOOR_W / 2 + FRAME_W / 2
  const outerTop = DOOR_H + FRAME_W / 2
  const outerBottom = FRAME_W / 2

  const baseY = centerY - DOOR_H / 2
  const stripPos = (uLocal: number, vLocal: number): [number, number, number] =>
    wallAxis === 'x'
      ? [centerX + uLocal, baseY + vLocal, centerZ + outwardOffset]
      : [centerX + outwardOffset, baseY + vLocal, centerZ + uLocal]

  return (
    <>
      <mesh position={stripPos(0, outerTop)} rotation={[0, rotationY, 0]}>
        <planeGeometry args={[DOOR_W + 2 * FRAME_W, FRAME_W]} />
        <meshBasicMaterial map={textures.top} toneMapped={false} />
      </mesh>
      <mesh position={stripPos(0, outerBottom)} rotation={[0, rotationY, 0]}>
        <planeGeometry args={[DOOR_W + 2 * FRAME_W, FRAME_W]} />
        <meshBasicMaterial map={textures.bottom} toneMapped={false} />
      </mesh>
      <mesh position={stripPos(outerLeft, DOOR_H / 2)} rotation={[0, rotationY, 0]}>
        <planeGeometry args={[FRAME_W, DOOR_H]} />
        <meshBasicMaterial map={textures.left} toneMapped={false} />
      </mesh>
      <mesh position={stripPos(outerRight, DOOR_H / 2)} rotation={[0, rotationY, 0]}>
        <planeGeometry args={[FRAME_W, DOOR_H]} />
        <meshBasicMaterial map={textures.right} toneMapped={false} />
      </mesh>
      {[
        [outerLeft, outerTop],
        [outerRight, outerTop],
        [outerLeft, outerBottom],
        [outerRight, outerBottom],
      ].map(([cx, cy], i) => {
        const p = stripPos(cx, cy)
        const offsetExtra = 0.001 * Math.sign(outwardOffset)
        const capPos: [number, number, number] = wallAxis === 'x'
          ? [p[0], p[1], p[2] + offsetExtra]
          : [p[0] + offsetExtra, p[1], p[2]]
        return (
          <mesh key={i} position={capPos} rotation={[0, rotationY, 0]}>
            <planeGeometry args={[FRAME_W * 0.8, FRAME_W * 0.8]} />
            <meshBasicMaterial color={cornerColor} toneMapped={false} />
          </mesh>
        )
      })}
    </>
  )
}
