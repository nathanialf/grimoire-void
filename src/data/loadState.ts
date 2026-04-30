import { useSyncExternalStore } from 'react'

// Per-cartridge load state. A pedestal can be empty ('absent'), holding a
// cartridge that's only partially seated ('partial' — bound doc shows a
// partial body in the wiki, see documents.md §"Partial visibility"), or
// fully loaded ('complete').
//
// Wiki visibility (isDocVisible in src/data/index.ts) reads this state:
// bound docs hide on 'absent'; ambient docs attached via DocEntry.attachedTo
// hide unless the parent is 'complete' (per documents.md, ambient docs
// have no partial state — they appear all-or-nothing).
export type CartridgeState = 'absent' | 'partial' | 'complete'

const STORAGE_KEY = 'gv:cartridge-states'
const STORAGE_VERSION = 1

interface StoredStates {
  v: number
  states: Record<string, CartridgeState>
}

// Default for any slug not explicitly stored. 'complete' means a fresh
// visitor sees the world as it is today — every cart loaded, every wiki
// entry visible. The eventual gameplay design may flip this to 'absent'
// (discovery-driven loading); changing this constant is the only edit.
const DEFAULT_STATE: CartridgeState = 'complete'

function isCartridgeState(v: unknown): v is CartridgeState {
  return v === 'absent' || v === 'partial' || v === 'complete'
}

function readStorage(): Record<string, CartridgeState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<StoredStates>
    if (parsed?.v !== STORAGE_VERSION || !parsed.states || typeof parsed.states !== 'object') {
      return {}
    }
    const out: Record<string, CartridgeState> = {}
    for (const [k, v] of Object.entries(parsed.states)) {
      if (typeof k === 'string' && isCartridgeState(v)) out[k] = v
    }
    return out
  } catch {
    // Corrupt JSON, quota errors on read, or restricted storage — start fresh.
    return {}
  }
}

function writeStorage(states: Record<string, CartridgeState>): void {
  if (typeof window === 'undefined') return
  try {
    const payload: StoredStates = { v: STORAGE_VERSION, states }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota exceeded or private-mode storage refusal — in-memory state is
    // still authoritative for the session, so swallow and keep going.
  }
}

let states: Record<string, CartridgeState> = readStorage()
const listeners = new Set<() => void>()

export function cartridgeStateOf(slug: string): CartridgeState {
  return states[slug] ?? DEFAULT_STATE
}

export function setCartridgeState(slug: string, state: CartridgeState): void {
  states = { ...states, [slug]: state }
  writeStorage(states)
  for (const l of listeners) l()
}

// Subscribe to the external store; React calls the cb on every state
// transition so components re-render. Snapshot identity is stable
// between transitions (we replace the object on every set), so the
// useSyncExternalStore equality check correctly skips no-op renders.
function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot(): Record<string, CartridgeState> {
  return states
}

export function useCartridgeStates(): Record<string, CartridgeState> {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
