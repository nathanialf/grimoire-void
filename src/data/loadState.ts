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
//
// Partial pedestals also persist their gathered fragments (the per-node
// flags from a docked partial cart). When the player retrieves a partial
// cart from a pedestal the gathered set rehydrates the in-hand cart so
// they can pick up where they left off across sessions.
//
// Discovered variations are stored alongside cartridge state because both
// are part of the same "what the player has unlocked" persistence layer.

export type CartridgeState = 'absent' | 'partial' | 'complete'

const STORAGE_KEY = 'gv:cartridge-states'
const STORAGE_VERSION = 2

interface SlotPayload {
  state: CartridgeState
  gathered?: Record<string, true>
}

interface StoredStates {
  v: number
  slots: Record<string, SlotPayload>
  discoveredVariations: string[]
}

// Default for any slug not explicitly stored. 'absent' is the discovery-
// driven progression: cartridges start unloaded, the wiki starts showing
// only standalone-ambient docs, and the player canonizes entries by
// docking carts. (Standalone ambient docs are visible regardless because
// isDocVisible's no-attachedTo branch returns true.)
const DEFAULT_STATE: CartridgeState = 'absent'

// Variations the player can access from first boot. Imported here so
// the store seeds the discovered set on init — the terminal's known-
// variations list is non-empty on a fresh save, which keeps the loop
// reachable without first reading anything.
import { BOOT_VARIATIONS } from './variations'

function isCartridgeState(v: unknown): v is CartridgeState {
  return v === 'absent' || v === 'partial' || v === 'complete'
}

function isStringRecordTrue(v: unknown): v is Record<string, true> {
  if (!v || typeof v !== 'object') return false
  for (const val of Object.values(v as Record<string, unknown>)) {
    if (val !== true) return false
  }
  return true
}

interface LoadedStorage {
  slots: Record<string, SlotPayload>
  discoveredVariations: string[]
}

function readStorage(): LoadedStorage {
  if (typeof window === 'undefined') return { slots: {}, discoveredVariations: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { slots: {}, discoveredVariations: [] }
    const parsed = JSON.parse(raw) as Partial<StoredStates>
    if (parsed?.v !== STORAGE_VERSION || !parsed.slots || typeof parsed.slots !== 'object') {
      return { slots: {}, discoveredVariations: [] }
    }
    const slots: Record<string, SlotPayload> = {}
    for (const [k, v] of Object.entries(parsed.slots)) {
      if (typeof k !== 'string' || !v || typeof v !== 'object') continue
      const payload = v as Partial<SlotPayload>
      if (!isCartridgeState(payload.state)) continue
      const gathered = isStringRecordTrue(payload.gathered) ? payload.gathered : undefined
      slots[k] = { state: payload.state, ...(gathered ? { gathered } : {}) }
    }
    const discoveredVariations = Array.isArray(parsed.discoveredVariations)
      ? parsed.discoveredVariations.filter((s): s is string => typeof s === 'string')
      : []
    return { slots, discoveredVariations }
  } catch {
    // Corrupt JSON, quota errors on read, or restricted storage — start fresh.
    return { slots: {}, discoveredVariations: [] }
  }
}

function writeStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const payload: StoredStates = {
      v: STORAGE_VERSION,
      slots,
      discoveredVariations,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota exceeded or private-mode storage refusal — in-memory state is
    // still authoritative for the session, so swallow and keep going.
  }
}

const initial = readStorage()
let slots: Record<string, SlotPayload> = initial.slots
let discoveredVariations: string[] = initial.discoveredVariations
// Seed any boot variations missing from the persisted set on first init,
// then write back if anything changed. Idempotent across reloads.
{
  const missing = BOOT_VARIATIONS.filter((k) => !discoveredVariations.includes(k))
  if (missing.length > 0) {
    discoveredVariations = [...discoveredVariations, ...missing]
    writeStorage()
  }
}
// Snapshot used by useCartridgeStates — exposed as `Record<slug, state>`
// (just the enum, not the gathered set) so existing visibility checks
// don't have to migrate. Fragment access goes through `gatheredOf` which
// reads the slot directly.
let stateSnapshot: Record<string, CartridgeState> = mapStates(slots)
let variationsSnapshot: string[] = [...discoveredVariations]
const listeners = new Set<() => void>()

function mapStates(s: Record<string, SlotPayload>): Record<string, CartridgeState> {
  const out: Record<string, CartridgeState> = {}
  for (const [k, v] of Object.entries(s)) out[k] = v.state
  return out
}

function notify(): void {
  for (const l of listeners) l()
}

export function cartridgeStateOf(slug: string): CartridgeState {
  return slots[slug]?.state ?? DEFAULT_STATE
}

export function gatheredOf(slug: string): Record<string, true> {
  return slots[slug]?.gathered ?? {}
}

// Single write path for cartridge slots — replaces the old
// setCartridgeState. `gathered` is optional; pass an empty object (or
// nothing) when transitioning to 'absent' or 'complete' to clear it.
export function setCartridge(
  slug: string,
  state: CartridgeState,
  gathered: Record<string, true> = {},
): void {
  const next: SlotPayload = Object.keys(gathered).length > 0
    ? { state, gathered }
    : { state }
  slots = { ...slots, [slug]: next }
  stateSnapshot = mapStates(slots)
  writeStorage()
  notify()
}

// Compatibility shim — the old API only persisted the enum. Callers that
// still use this won't lose any gathered fragments because a state-only
// transition (e.g. 'complete') normally implies a full clear anyway.
export function setCartridgeState(slug: string, state: CartridgeState): void {
  setCartridge(slug, state, slots[slug]?.gathered ?? {})
}

export function isVariationDiscovered(key: string): boolean {
  return discoveredVariations.includes(key)
}

export function addDiscoveredVariation(key: string): void {
  if (discoveredVariations.includes(key)) return
  discoveredVariations = [...discoveredVariations, key]
  variationsSnapshot = [...discoveredVariations]
  writeStorage()
  notify()
}

// Seed the discovered set with always-known boot variations on first
// init. Idempotent; only writes if the seed actually adds something new.
export function seedDiscoveredVariations(seed: string[]): void {
  const missing = seed.filter((k) => !discoveredVariations.includes(k))
  if (missing.length === 0) return
  discoveredVariations = [...discoveredVariations, ...missing]
  variationsSnapshot = [...discoveredVariations]
  writeStorage()
  notify()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getStatesSnapshot(): Record<string, CartridgeState> {
  return stateSnapshot
}

function getVariationsSnapshot(): string[] {
  return variationsSnapshot
}

export function useCartridgeStates(): Record<string, CartridgeState> {
  return useSyncExternalStore(subscribe, getStatesSnapshot, getStatesSnapshot)
}

export function useDiscoveredVariations(): string[] {
  return useSyncExternalStore(subscribe, getVariationsSnapshot, getVariationsSnapshot)
}
