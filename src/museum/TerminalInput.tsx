import { useEffect, useRef, useState } from 'react'
import {
  type Variation,
  VARIATIONS,
  findVariationByKeyword,
} from '../data/variations'
import {
  addDiscoveredVariation,
  isVariationDiscovered,
  useDiscoveredVariations,
} from '../data/loadState'
import styles from '../styles/TerminalInput.module.css'

interface TerminalInputProps {
  onLoad: (key: string) => void
  onClose: () => void
  // When true, the dialog renders without its own backdrop so it can be
  // embedded on the in-world CRT screen (drei `<Html transform>`).
  // The panel itself fills the parent container instead of self-sizing.
  embedded?: boolean
}

// HTML overlay (DOM, not WebGL) shown when the player engages the variant
// terminal. Lists variations the player has previously discovered as
// click-to-load buttons, plus a text input for entering keywords to
// unlock new variations. Keyword match is case-insensitive exact (per
// variations-and-terminal.md). On miss the status line flashes red.
//
// PointerLockControls is unmounted while this is open (MuseumPage passes
// locked=true to Controls) so the input can take focus without fighting
// the FPS movement system.
export function TerminalInput({ onLoad, onClose, embedded = false }: TerminalInputProps) {
  const discovered = useDiscoveredVariations()
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<{ kind: 'idle' } | { kind: 'error'; msg: string } | { kind: 'ok'; msg: string }>({ kind: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // ESC closes — wired here rather than via Controls to keep the close
  // path independent of pointer-lock state.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const knownVariations: Variation[] = VARIATIONS.filter((v) => discovered.includes(v.key))

  const submit = () => {
    const v = findVariationByKeyword(input)
    if (!v) {
      setStatus({ kind: 'error', msg: 'PATTERN UNKNOWN' })
      return
    }
    if (!isVariationDiscovered(v.key)) {
      addDiscoveredVariation(v.key)
      setStatus({ kind: 'ok', msg: `VARIATION FILED · ${v.title}` })
    }
    setInput('')
    onLoad(v.key)
  }

  const panel = (
    <div
      className={embedded ? styles.panelEmbedded : styles.panel}
      onClick={(e) => e.stopPropagation()}
    >
        <div className={styles.header}>
          <span className={styles.title}>// VARIANT TERMINAL</span>
          <button className={styles.close} onClick={onClose} aria-label="Close terminal">×</button>
        </div>
        <div className={styles.section}>
          <span className={styles.sectionLabel}>KNOWN VARIATIONS</span>
          <ul className={styles.knownList}>
            {knownVariations.length === 0 && (
              <li className={styles.knownEmpty}>— NONE FILED —</li>
            )}
            {knownVariations.map((v) => (
              <li key={v.key}>
                <button
                  className={styles.knownButton}
                  onClick={() => { setInput(''); onLoad(v.key) }}
                >
                  {v.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.section}>
          <span className={styles.sectionLabel}>ENTER KEYWORD</span>
          <form
            className={styles.inputRow}
            onSubmit={(e) => { e.preventDefault(); submit() }}
          >
            <input
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => { setInput(e.target.value); if (status.kind !== 'idle') setStatus({ kind: 'idle' }) }}
              placeholder="…"
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
            <button type="submit" className={styles.submit}>ENTER</button>
          </form>
          <div
            className={`${styles.status} ${status.kind === 'error' ? styles.statusError : ''} ${status.kind === 'ok' ? styles.statusOk : ''}`}
            role="status"
            aria-live="polite"
          >
            {status.kind === 'idle' ? ' ' : status.msg}
          </div>
        </div>
    </div>
  )

  if (embedded) {
    // Embedded mode: parent (drei <Html transform>) sized the surface
    // to fit the in-world CRT screen, so the panel just fills it. No
    // backdrop — the screen *is* the surface.
    return panel
  }
  return (
    <div className={styles.backdrop} onClick={onClose}>
      {panel}
    </div>
  )
}
