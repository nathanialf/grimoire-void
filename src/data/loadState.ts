import { useSyncExternalStore } from 'react'
import { BOOT_VARIATIONS } from './variations'

// Per-pedestal load state. The museum's 16 pedestal slots are anonymous —
// no slug is hard-mapped to a slot. When the player docks a cart, the
// dock writes { slug, state, gathered } into whatever slot they were
// looking at. Slug binding is by-cart, not by-slot, and a single slug
// occupies at most one slot at any moment (one-cart-at-a-time invariant
// + complete-is-permanent + retrieve-only-if-partial together).
//
// Wiki visibility (isDocVisible in src/data/index.ts) reads the derived
// slug→state snapshot:
//   - cart-bearing doc: hidden when no slot holds its slug, visible at
//     'partial' or 'complete' otherwise.
//   - attached ambient: visible only when the parent slug is seated in
//     some slot at 'complete'.
//   - standalone ambient: always visible.
//
// Discovered variations are stored alongside slot state because both
// are part of the same "what the player has unlocked" persistence layer.

export type CartridgeState = 'partial' | 'complete'

const STORAGE_KEY = 'gv:cartridge-states'
const STORAGE_VERSION = 3

export interface SlotPayload {
  slug: string
  state: CartridgeState
  gathered: Record<string, true>
}

interface StoredStates {
  v: number
  // Slot index → payload. Empty slots are absent from the map.
  slots: Record<string, SlotPayload>
  discoveredVariations: string[]
}

function isCartridgeState(v: unknown): v is CartridgeState {
  return v === 'partial' || v === 'complete'
}

function isStringRecordTrue(v: unknown): v is Record<string, true> {
  if (!v || typeof v !== 'object') return false
  for (const val of Object.values(v as Record<string, unknown>)) {
    if (val !== true) return false
  }
  return true
}

interface LoadedStorage {
  slots: Record<number, SlotPayload>
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
    const slots: Record<number, SlotPayload> = {}
    for (const [k, v] of Object.entries(parsed.slots)) {
      const idx = Number(k)
      if (!Number.isInteger(idx) || idx < 0) continue
      if (!v || typeof v !== 'object') continue
      const payload = v as Partial<SlotPayload>
      if (typeof payload.slug !== 'string' || !payload.slug) continue
      if (!isCartridgeState(payload.state)) continue
      const gathered = isStringRecordTrue(payload.gathered) ? payload.gathered : {}
      slots[idx] = { slug: payload.slug, state: payload.state, gathered }
    }
    const discoveredVariations = Array.isArray(parsed.discoveredVariations)
      ? parsed.discoveredVariations.filter((s): s is string => typeof s === 'string')
      : []
    return { slots, discoveredVariations }
  } catch {
    return { slots: {}, discoveredVariations: [] }
  }
}

function writeStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const out: Record<string, SlotPayload> = {}
    for (const [k, v] of Object.entries(slots)) out[k] = v
    const payload: StoredStates = {
      v: STORAGE_VERSION,
      slots: out,
      discoveredVariations,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota exceeded or private-mode storage refusal.
  }
}

const initial = readStorage()
let slots: Record<number, SlotPayload> = initial.slots
let discoveredVariations: string[] = initial.discoveredVariations
{
  const missing = BOOT_VARIATIONS.filter((k) => !discoveredVariations.includes(k))
  if (missing.length > 0) {
    discoveredVariations = [...discoveredVariations, ...missing]
    writeStorage()
  }
}

// Snapshots used by useSyncExternalStore — replaced (not mutated) on
// every transition so React's identity-equality skips no-op renders.
let slotsSnapshot: Record<number, SlotPayload> = { ...slots }
let slugStateSnapshot: Record<string, CartridgeState> = mapSlugStates(slots)
let variationsSnapshot: string[] = [...discoveredVariations]
const listeners = new Set<() => void>()

function mapSlugStates(s: Record<number, SlotPayload>): Record<string, CartridgeState> {
  const out: Record<string, CartridgeState> = {}
  for (const v of Object.values(s)) out[v.slug] = v.state
  return out
}

function refreshSnapshots(): void {
  slotsSnapshot = { ...slots }
  slugStateSnapshot = mapSlugStates(slots)
}

function notify(): void {
  for (const l of listeners) l()
}

// Slug-keyed lookups. The wiki only knows about slugs, not slots, so
// these are the helpers it needs.
export function cartridgeStateBySlug(slug: string): CartridgeState | 'absent' {
  for (const v of Object.values(slots)) if (v.slug === slug) return v.state
  return 'absent'
}

export function gatheredBySlug(slug: string): Record<string, true> {
  for (const v of Object.values(slots)) if (v.slug === slug) return v.gathered
  return {}
}

export function slotOfSlug(slug: string): number {
  for (const [k, v] of Object.entries(slots)) if (v.slug === slug) return Number(k)
  return -1
}

// Slot-keyed lookups, used by Pedestal rendering and dock/retrieve
// triggers.
export function slotPayload(slotIndex: number): SlotPayload | null {
  return slots[slotIndex] ?? null
}

export function setSlot(
  slotIndex: number,
  slug: string,
  state: CartridgeState,
  gathered: Record<string, true>,
): void {
  slots = { ...slots, [slotIndex]: { slug, state, gathered } }
  refreshSnapshots()
  writeStorage()
  notify()
}

export function clearSlot(slotIndex: number): void {
  if (!(slotIndex in slots)) return
  const next = { ...slots }
  delete next[slotIndex]
  slots = next
  refreshSnapshots()
  writeStorage()
  notify()
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

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSlugStateSnapshot(): Record<string, CartridgeState> {
  return slugStateSnapshot
}

function getSlotsSnapshot(): Record<number, SlotPayload> {
  return slotsSnapshot
}

function getVariationsSnapshot(): string[] {
  return variationsSnapshot
}

// Wiki/component subscription: gives slug → state for all currently-
// seated cartridges. Slugs not present mean "no slot holds this cart"
// (i.e. wiki visibility = absent).
export function useCartridgeStates(): Record<string, CartridgeState> {
  return useSyncExternalStore(subscribe, getSlugStateSnapshot, getSlugStateSnapshot)
}

// Per-slot snapshot for Pedestal rendering.
export function useSlots(): Record<number, SlotPayload> {
  return useSyncExternalStore(subscribe, getSlotsSnapshot, getSlotsSnapshot)
}

export function useDiscoveredVariations(): string[] {
  return useSyncExternalStore(subscribe, getVariationsSnapshot, getVariationsSnapshot)
}

// Reactive lookup of the docked slot's gathered map for a given slug.
// Returns the literal `Record<string, true>` from the slot (one slot
// per slug by invariant) so downstream code can resolve gathered node
// IDs to authored reveal refs. Held-cart progress is intentionally
// excluded because the wiki only reflects canonised / partially-
// canonised material — fragments still in-hand have not entered the
// archive yet.
const EMPTY_GATHERED: Record<string, true> = Object.freeze({}) as Record<string, true>
export function useGatheredBySlug(slug: string): Record<string, true> {
  const slotsByIndex = useSlots()
  for (const v of Object.values(slotsByIndex)) {
    if (v.slug === slug) return v.gathered
  }
  return EMPTY_GATHERED
}
