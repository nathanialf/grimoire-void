import { useSyncExternalStore } from 'react'

// Operator/dev-style settings that persist across reloads but aren't tied
// to the cartridge progression layer. Currently holds the vision tier
// (the suit/sensor degradation level applied to Carcosa). Kept in its
// own storage key so loadState.ts doesn't need a version bump every time
// a new dev toggle lands here.

export type VisionTier = 0 | 1 | 2 // 0=vertices, 1=wireframe, 2=full

export const DEFAULT_VISION_TIER: VisionTier = 2

const STORAGE_KEY = 'gv:settings'
const STORAGE_VERSION = 1

interface StoredSettings {
  v: number
  visionTier: VisionTier
}

function isVisionTier(v: unknown): v is VisionTier {
  return v === 0 || v === 1 || v === 2
}

function readStorage(): VisionTier {
  if (typeof window === 'undefined') return DEFAULT_VISION_TIER
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_VISION_TIER
    const parsed = JSON.parse(raw) as Partial<StoredSettings>
    if (parsed?.v !== STORAGE_VERSION) return DEFAULT_VISION_TIER
    if (!isVisionTier(parsed.visionTier)) return DEFAULT_VISION_TIER
    return parsed.visionTier
  } catch {
    return DEFAULT_VISION_TIER
  }
}

function writeStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const payload: StoredSettings = { v: STORAGE_VERSION, visionTier }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota exceeded or private-mode storage refusal.
  }
}

let visionTier: VisionTier = readStorage()
const listeners = new Set<() => void>()

function notify(): void {
  for (const l of listeners) l()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot(): VisionTier {
  return visionTier
}

export function setVisionTier(tier: VisionTier): void {
  if (visionTier === tier) return
  visionTier = tier
  writeStorage()
  notify()
}

export function getVisionTier(): VisionTier {
  return visionTier
}

export function useVisionTier(): VisionTier {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
