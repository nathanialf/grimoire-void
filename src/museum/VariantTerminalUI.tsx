import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Text } from '@react-three/drei'
import {
  CanvasTexture,
  Color,
  Group,
  Mesh,
  NearestFilter,
  SRGBColorSpace,
} from 'three'
import {
  VARIATIONS,
  findVariationByKeyword,
  type Variation,
} from '../data/variations'
import {
  addDiscoveredVariation,
  isVariationDiscovered,
  useDiscoveredVariations,
} from '../data/loadState'

// In-scene WebGL implementation of the variant terminal dialog. Lives
// inside the Canvas so the EffectComposer post-FX (bloom, halation,
// scanlines, CA, vignette) hits it like any other mesh — the green
// phosphor glow comes from real bloom on emissive `<Text>`, not CSS
// text-shadow. Replaces a previous DOM/<Html transform> attempt that
// composited separately from the WebGL framebuffer and so was
// untouched by post-FX (and fragile re: CSS3D matrix math).
//
// All measurements are in world units (metres). The dialog group sits
// on the CRT screen plane; CarcosaTerminal renders the live boot-log
// behind us and we composite a translucent backplate on top.

// Dialog rect — matches CarcosaTerminal's screen rect (78% × 70% of
// the wall fixture) so the dialog covers the visible CRT face.
const W = 0.5616
const H = 0.42
const PAD_X = 0.024
const PAD_Y = 0.020
const HEADER_H = 0.044
const SECTION_LABEL_H = 0.022
const ROW_H = 0.030
const ROW_GAP = 0.006
const SECTION_GAP = 0.014
const INPUT_H = 0.040
const STATUS_H = 0.022
const SUBMIT_W = 0.110
const INPUT_BUTTON_GAP = 0.010
const BORDER_T = 0.0025
const Z_BACKPLATE = 0
const Z_SCANLINES = 0.0008
const Z_VIGNETTE = 0.0014
const Z_BORDER = 0.0020
const Z_CONTENT = 0.0030
const Z_TEXT = 0.0036

const PHOSPHOR = '#7cffa3'
const PHOSPHOR_DIM = '#9ad7ad'
const PHOSPHOR_FAINT = '#5fbf7f'
const HOVER_WHITE = '#ffffff'
const ERR = '#ff5e6b'
const PANEL_BG = '#040806'
const INPUT_BG = '#0a1410'
// troika-three-text (drei <Text>'s engine) only loads .ttf / .otf —
// .woff2 throws "woff2 fonts not supported". The .ttf is larger
// (~270 KB vs ~92 KB) but it's the only format that actually works.
const FONT_URL = '/fonts/JetBrainsMono-Regular.ttf'

const SIZE_TITLE = 0.020
const SIZE_LABEL = 0.013
const SIZE_ROW = 0.017
const SIZE_INPUT = 0.020
const SIZE_STATUS = 0.013
const SIZE_CLOSE = 0.030

const POWER_ON_MS = 240
const ERROR_FLASH_MS = 240
const CARET_BLINK_MS = 460
const MAX_INPUT = 32

interface Props {
  position: [number, number, number]
  onLoad: (key: string) => void
  onClose: () => void
  // True when the player is on a touch device. Mounts a hidden DOM
  // <input> so the soft keyboard appears on tap; typing flows back
  // into the mesh-rendered display via the shared input state.
  touch: boolean
}

// 1px-on/1px-off horizontal stripes at alpha 0.18 — same recipe used
// by CarcosaTerminal's paintScreen scanline overlay (lines 68–72).
function makeScanlineTexture(): CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  for (let y = 0; y < size; y += 2) ctx.fillRect(0, y, size, 1)
  const tex = new CanvasTexture(canvas)
  tex.magFilter = NearestFilter
  tex.minFilter = NearestFilter
  tex.generateMipmaps = false
  tex.colorSpace = SRGBColorSpace
  return tex
}

// Radial-gradient corner darken — transparent center, ~55% black at
// the edges. Same square-falloff feel as CarcosaTerminal's halo but
// inverted (darken instead of brighten) and used on top instead of
// behind.
function makeVignetteTexture(): CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grd = ctx.createRadialGradient(size / 2, size / 2, size * 0.15, size / 2, size / 2, size * 0.7)
  grd.addColorStop(0, 'rgba(0,0,0,0)')
  grd.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, size, size)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  return tex
}

function isPrintable(key: string): boolean {
  return key.length === 1 && /[A-Za-z0-9 \-'·]/.test(key)
}

// Cubic ease-out for the power-on scale ramp.
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function VariantTerminalUI({ position, onLoad, onClose, touch }: Props) {
  const discovered = useDiscoveredVariations()
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'error'; msg: string }
    | { kind: 'ok'; msg: string }
  >({ kind: 'idle' })

  const groupRef = useRef<Group>(null)
  const mountedAt = useRef(0)
  const errorFlashAt = useRef<number | null>(null)
  const caretRef = useRef<Mesh>(null)
  const lastCaretAt = useRef(0)
  const caretOnRef = useRef(true)
  const statusTextRef = useRef<{ color: Color } | null>(null)
  const errorBgRef = useRef<Mesh>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scanlineTex = useMemo(() => makeScanlineTexture(), [])
  const vignetteTex = useMemo(() => makeVignetteTexture(), [])

  // Reset state on each open. The component is unmounted when the
  // parent's `visible` flag flips, so a [] effect runs once per open.
  // Don't auto-focus on touch — iOS only pops the soft keyboard when
  // .focus() runs synchronously inside a user gesture, and the
  // component mounts ~480 ms after the trigger click, by which point
  // the gesture's transient activation has expired. The user taps
  // the input mesh to focus instead (see TouchInputOverlay).
  useEffect(() => {
    mountedAt.current = performance.now()
    setInput('')
    setStatus({ kind: 'idle' })
    return () => {
      document.body.style.cursor = ''
    }
  }, [])

  const submit = useMemo(
    () => (raw: string) => {
      const v = findVariationByKeyword(raw)
      if (!v) {
        setStatus({ kind: 'error', msg: 'PATTERN UNKNOWN' })
        errorFlashAt.current = performance.now()
        return
      }
      if (!isVariationDiscovered(v.key)) {
        addDiscoveredVariation(v.key)
        setStatus({ kind: 'ok', msg: `VARIATION FILED · ${v.title}` })
      }
      setInput('')
      onLoad(v.key)
    },
    [onLoad],
  )

  // Desktop keyboard capture. Skip on touch — the hidden <input> drives
  // the value through onChange instead, so we don't double-handle keys.
  useEffect(() => {
    if (touch) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        submit(input)
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        setInput((s) => s.slice(0, -1))
        if (status.kind !== 'idle') setStatus({ kind: 'idle' })
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault()
        navigator.clipboard?.readText?.().then((text) => {
          const cleaned = text.replace(/[^\w \-'·]/g, '').slice(0, MAX_INPUT)
          setInput((s) => (s + cleaned).slice(0, MAX_INPUT))
          if (status.kind !== 'idle') setStatus({ kind: 'idle' })
        }).catch(() => {})
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (!isPrintable(e.key)) return
      e.preventDefault()
      setInput((s) => (s + e.key).slice(0, MAX_INPUT))
      if (status.kind !== 'idle') setStatus({ kind: 'idle' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [touch, input, submit, onClose, status.kind])

  // Drive power-on scale, caret blink, and the error-flash colour fade.
  useFrame(() => {
    const tMs = performance.now()
    if (groupRef.current) {
      const elapsed = tMs - mountedAt.current
      const u = Math.min(1, elapsed / POWER_ON_MS)
      const s = 0.94 + 0.06 * easeOutCubic(u)
      groupRef.current.scale.setScalar(s)
    }
    if (caretRef.current) {
      if (tMs - lastCaretAt.current > CARET_BLINK_MS) {
        caretOnRef.current = !caretOnRef.current
        lastCaretAt.current = tMs
      }
      caretRef.current.visible = caretOnRef.current && status.kind !== 'ok'
    }
    if (errorBgRef.current) {
      const start = errorFlashAt.current
      if (start !== null) {
        const e = tMs - start
        if (e >= ERROR_FLASH_MS) {
          errorBgRef.current.visible = false
          errorFlashAt.current = null
        } else {
          const k = 1 - e / ERROR_FLASH_MS
          errorBgRef.current.visible = true
          ;(errorBgRef.current.material as { opacity: number; transparent: boolean }).opacity = 0.18 * k
        }
      }
    }
  })

  const knownVariations: Variation[] = VARIATIONS.filter((v) => discovered.includes(v.key))

  // Layout — top-left walking down. yTop is the baseline for the next
  // section; we decrement as we lay out each row.
  const xLeft = -W / 2 + PAD_X
  let yCursor = H / 2 - PAD_Y
  const headerCY = yCursor - HEADER_H / 2
  yCursor -= HEADER_H + SECTION_GAP

  const knownLabelCY = yCursor - SECTION_LABEL_H / 2
  yCursor -= SECTION_LABEL_H + ROW_GAP

  const knownRowsTopY = yCursor
  const rowsToShow = knownVariations.length || 1 // empty-state row
  yCursor -= rowsToShow * ROW_H + Math.max(0, rowsToShow - 1) * ROW_GAP
  yCursor -= SECTION_GAP

  const inputLabelCY = yCursor - SECTION_LABEL_H / 2
  yCursor -= SECTION_LABEL_H + ROW_GAP

  const inputRowCY = yCursor - INPUT_H / 2
  yCursor -= INPUT_H + ROW_GAP

  const statusCY = yCursor - STATUS_H / 2

  // Status display.
  const statusMsg = status.kind === 'idle' ? '' : status.msg
  const statusColor = status.kind === 'error' ? ERR : status.kind === 'ok' ? HOVER_WHITE : PHOSPHOR_FAINT

  // Input field display rect.
  const inputW = W - PAD_X * 2 - SUBMIT_W - INPUT_BUTTON_GAP
  const inputCX = xLeft + inputW / 2
  const submitCX = xLeft + inputW + INPUT_BUTTON_GAP + SUBMIT_W / 2

  // Caret position — at the right edge of the rendered input value.
  // We approximate text width using a monospace metric: 0.6 × fontSize.
  const charAdvance = SIZE_INPUT * 0.6
  const caretX = xLeft + 0.014 + Math.min(inputW - 0.028, input.length * charAdvance)

  return (
    <>
      <group ref={groupRef} position={position}>
        {/* z=0 backplate — semi-transparent so the live boot-log
            scrolling on the CRT behind keeps showing through. */}
        <mesh position={[0, 0, Z_BACKPLATE]}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial
            color={PANEL_BG}
            transparent
            opacity={0.55}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>

        {/* z=0.001 scanline overlay */}
        <mesh position={[0, 0, Z_SCANLINES]} raycast={() => null}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial
            map={scanlineTex}
            transparent
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>

        {/* z=0.0014 corner vignette */}
        <mesh position={[0, 0, Z_VIGNETTE]} raycast={() => null}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial
            map={vignetteTex}
            transparent
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>

        {/* z=0.002 border — four thin emissive segments */}
        <BorderFrame w={W} h={H} thickness={BORDER_T} color={PHOSPHOR} z={Z_BORDER} />

        {/* z=0.0028 error-flash backplate — invisible idle, briefly
            tinted on a bad keyword submit. useFrame fades opacity. */}
        <mesh ref={errorBgRef} position={[0, 0, Z_CONTENT - 0.0002]} visible={false} raycast={() => null}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial color={ERR} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>

        {/* HEADER */}
        <Text
          font={FONT_URL}
          fontSize={SIZE_TITLE}
          color={PHOSPHOR}
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.18}
          material-toneMapped={false}
          position={[xLeft, headerCY, Z_TEXT]}
        >
          {'// VARIANT TERMINAL'}
        </Text>
        <CloseButton
          onClose={onClose}
          position={[W / 2 - PAD_X - 0.02, headerCY, Z_TEXT]}
        />

        {/* Header divider — thin emissive line under the header */}
        <mesh
          position={[0, headerCY - HEADER_H / 2 - 0.001, Z_BORDER]}
          raycast={() => null}
        >
          <planeGeometry args={[W - PAD_X * 2, 0.0010]} />
          <meshBasicMaterial color={PHOSPHOR_FAINT} toneMapped={false} transparent opacity={0.55} />
        </mesh>

        {/* KNOWN VARIATIONS section label */}
        <Text
          font={FONT_URL}
          fontSize={SIZE_LABEL}
          color={PHOSPHOR_DIM}
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.22}
          material-toneMapped={false}
          position={[xLeft, knownLabelCY, Z_TEXT]}
        >
          KNOWN VARIATIONS
        </Text>

        {/* KNOWN VARIATIONS rows or empty state */}
        {knownVariations.length === 0 ? (
          <Text
            font={FONT_URL}
            fontSize={SIZE_ROW}
            color={PHOSPHOR_FAINT}
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.12}
            material-toneMapped={false}
            position={[xLeft + 0.010, knownRowsTopY - ROW_H / 2, Z_TEXT]}
          >
            — NONE FILED —
          </Text>
        ) : (
          knownVariations.map((v, i) => (
            <KnownRow
              key={v.key}
              title={v.title}
              w={W - PAD_X * 2}
              h={ROW_H}
              position={[0, knownRowsTopY - ROW_H / 2 - i * (ROW_H + ROW_GAP), Z_CONTENT]}
              xLeft={xLeft + 0.010}
              onClick={() => onLoad(v.key)}
            />
          ))
        )}

        {/* ENTER KEYWORD section label */}
        <Text
          font={FONT_URL}
          fontSize={SIZE_LABEL}
          color={PHOSPHOR_DIM}
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.22}
          material-toneMapped={false}
          position={[xLeft, inputLabelCY, Z_TEXT]}
        >
          ENTER KEYWORD
        </Text>

        {/* Input field — backplate, border, value text, blinking caret.
            On desktop the backplate is non-interactive (window keydown
            captures input). On touch, tapping the backplate focuses
            the overlay <input> so iOS/Android pop the soft keyboard
            via a real user gesture. */}
        <mesh
          position={[inputCX, inputRowCY, Z_CONTENT]}
          onClick={touch ? (e) => { e.stopPropagation(); inputRef.current?.focus() } : undefined}
        >
          <planeGeometry args={[inputW, INPUT_H]} />
          <meshBasicMaterial color={INPUT_BG} toneMapped={false} />
        </mesh>
        <BorderFrame
          w={inputW}
          h={INPUT_H}
          thickness={0.0015}
          color={PHOSPHOR_FAINT}
          z={Z_BORDER}
          centerX={inputCX}
          centerY={inputRowCY}
        />
        <Text
          font={FONT_URL}
          fontSize={SIZE_INPUT}
          color={HOVER_WHITE}
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.14}
          material-toneMapped={false}
          position={[xLeft + 0.014, inputRowCY, Z_TEXT]}
          maxWidth={inputW - 0.028}
          whiteSpace="nowrap"
        >
          {input || ' '}
        </Text>
        <mesh ref={caretRef} position={[caretX, inputRowCY, Z_TEXT]}>
          <planeGeometry args={[0.005, SIZE_INPUT * 0.9]} />
          <meshBasicMaterial color={PHOSPHOR} toneMapped={false} />
        </mesh>

        {/* Submit ENTER button */}
        <SubmitButton
          label="ENTER"
          w={SUBMIT_W}
          h={INPUT_H}
          position={[submitCX, inputRowCY, Z_CONTENT]}
          onClick={() => submit(input)}
        />

        {/* Status line */}
        <Text
          ref={(t) => { statusTextRef.current = t as unknown as { color: Color } | null }}
          font={FONT_URL}
          fontSize={SIZE_STATUS}
          color={statusColor}
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.16}
          material-toneMapped={false}
          position={[xLeft, statusCY, Z_TEXT]}
        >
          {statusMsg}
        </Text>
      </group>

      {/* Touch overlay: a transparent DOM <input> positioned over the
          input mesh on screen. Tapping it focuses, the OS pops its
          soft keyboard, typing flows directly into React state via
          onChange. The input is opacity 0 — the mesh-rendered text
          and blinking caret behind continue to display the value
          (so the touch player still sees the diegetic phosphor
          treatment) while the DOM input handles all native behaviour
          (focus, IME, predictive text, paste, selection). */}
      {touch && (
        <TouchInputOverlay
          inputRef={inputRef}
          worldPosition={[
            position[0] + inputCX,
            position[1] + inputRowCY,
            position[2] + Z_CONTENT,
          ]}
          value={input}
          onChange={(v) => {
            setInput(v.slice(0, MAX_INPUT))
            if (status.kind !== 'idle') setStatus({ kind: 'idle' })
          }}
          onSubmit={() => submit(input)}
          onClose={onClose}
        />
      )}
    </>
  )
}

interface KnownRowProps {
  title: string
  w: number
  h: number
  position: [number, number, number]
  xLeft: number
  onClick: () => void
}

function KnownRow({ title, w, h, position, xLeft, onClick }: KnownRowProps) {
  const [hover, setHover] = useState(false)
  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = '' }}
        onClick={(e) => { e.stopPropagation(); onClick() }}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          color={hover ? PHOSPHOR : INPUT_BG}
          transparent
          opacity={hover ? 0.14 : 0}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <BorderFrame
        w={w}
        h={h}
        thickness={0.0010}
        color={hover ? PHOSPHOR : PHOSPHOR_FAINT}
        z={0.0008}
      />
      <Text
        font={FONT_URL}
        fontSize={SIZE_ROW}
        color={hover ? HOVER_WHITE : PHOSPHOR}
        anchorX="left"
        anchorY="middle"
        letterSpacing={0.16}
        material-toneMapped={false}
        position={[xLeft - position[0], 0, 0.0014]}
      >
        {title}
      </Text>
    </group>
  )
}

interface SubmitButtonProps {
  label: string
  w: number
  h: number
  position: [number, number, number]
  onClick: () => void
}

function SubmitButton({ label, w, h, position, onClick }: SubmitButtonProps) {
  const [hover, setHover] = useState(false)
  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = '' }}
        onClick={(e) => { e.stopPropagation(); onClick() }}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          color={hover ? PHOSPHOR : INPUT_BG}
          transparent
          opacity={hover ? 0.18 : 0.001}
          toneMapped={false}
        />
      </mesh>
      <BorderFrame
        w={w}
        h={h}
        thickness={0.0015}
        color={PHOSPHOR}
        z={0.0008}
      />
      <Text
        font={FONT_URL}
        fontSize={SIZE_LABEL}
        color={hover ? HOVER_WHITE : PHOSPHOR}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.18}
        material-toneMapped={false}
        position={[0, 0, 0.0014]}
      >
        {label}
      </Text>
    </group>
  )
}

interface CloseButtonProps {
  onClose: () => void
  position: [number, number, number]
}

function CloseButton({ onClose, position }: CloseButtonProps) {
  const [hover, setHover] = useState(false)
  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = '' }}
        onClick={(e) => { e.stopPropagation(); onClose() }}
      >
        <planeGeometry args={[0.040, 0.040]} />
        <meshBasicMaterial transparent opacity={0} toneMapped={false} />
      </mesh>
      <Text
        font={FONT_URL}
        fontSize={SIZE_CLOSE}
        color={hover ? HOVER_WHITE : PHOSPHOR}
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        position={[0, 0, 0.0006]}
      >
        ×
      </Text>
    </group>
  )
}

interface BorderFrameProps {
  w: number
  h: number
  thickness: number
  color: string
  z: number
  centerX?: number
  centerY?: number
}

function BorderFrame({ w, h, thickness, color, z, centerX = 0, centerY = 0 }: BorderFrameProps) {
  const t = thickness
  const half = w / 2
  const halfH = h / 2
  return (
    <group position={[centerX, centerY, z]}>
      {/* top */}
      <mesh position={[0, halfH - t / 2, 0]} raycast={() => null}>
        <planeGeometry args={[w, t]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* bottom */}
      <mesh position={[0, -halfH + t / 2, 0]} raycast={() => null}>
        <planeGeometry args={[w, t]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* left */}
      <mesh position={[-half + t / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[t, h]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* right */}
      <mesh position={[half - t / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[t, h]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}

interface TouchInputOverlayProps {
  inputRef: React.RefObject<HTMLInputElement | null>
  // World-space position of the input mesh. drei <Html> projects it
  // to screen and places the wrapper there; we sit centered on it.
  worldPosition: [number, number, number]
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onClose: () => void
}

// Transparent DOM <input> overlay positioned over the input mesh's
// projected screen location via drei <Html> (no transform mode — just
// 2D screen-space placement). Render-time props:
//   - opacity: 0   → the mesh's emissive phosphor text + blinking caret
//                    behind remain the visible UI; the input is purely
//                    a tap target + native typing surface.
//   - controlled value → React owns state. We do NOT programmatically
//                    write back to el.value; that races with Android's
//                    'input' events during predictive-text composition
//                    and produced the garbled-order bug.
//   - focus on tap → the parent's input mesh has an onClick that calls
//                    inputRef.current?.focus(). iOS pops the soft
//                    keyboard only from a synchronous user gesture,
//                    which the mesh click is.
function TouchInputOverlay({
  inputRef,
  worldPosition,
  value,
  onChange,
  onSubmit,
  onClose,
}: TouchInputOverlayProps) {
  // Approximate the input mesh's on-screen size in CSS pixels using
  // the locked camera geometry (0.9 m head-on, fov 68°). Using the
  // viewport height as a stable reference; window resize updates via
  // the listener below.
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  }))
  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const FOV_Y_RAD = (68 * Math.PI) / 180
  const distance = 0.9
  const pxPerWorldUnit = viewport.h / (2 * Math.tan(FOV_Y_RAD / 2) * distance)
  // inputW / INPUT_H are the input mesh's world dimensions.
  const inputWorldW = W - PAD_X * 2 - SUBMIT_W - INPUT_BUTTON_GAP
  const widthPx = Math.round(inputWorldW * pxPerWorldUnit)
  const heightPx = Math.round(INPUT_H * pxPerWorldUnit)

  return (
    <Html
      position={worldPosition}
      center
      zIndexRange={[1000, 0]}
      // Don't intercept r3f raycasts on the surrounding meshes — the
      // input only swallows pointer events on its own footprint.
      pointerEvents="auto"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); onSubmit() }
          else if (e.key === 'Escape') { e.preventDefault(); onClose() }
        }}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        maxLength={MAX_INPUT}
        style={{
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          // Opacity 0 — the mesh-rendered text/caret behind is what
          // the player sees; this input handles touch + IME only.
          opacity: 0,
          padding: 0,
          margin: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          // Caret-color none on top of opacity 0 just in case some
          // browsers ignore opacity for the caret.
          caretColor: 'transparent',
          // Match the mesh font so any cursor-positioning gestures
          // (e.g. iOS magnifier) feel proportional to what's shown.
          font: `${Math.round(SIZE_INPUT * pxPerWorldUnit * 0.85)}px ui-monospace, "JetBrains Mono", monospace`,
          color: '#7cffa3',
          letterSpacing: '0.14em',
          // Block long-press selection / callouts from popping.
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      />
    </Html>
  )
}
