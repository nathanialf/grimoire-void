import { useSyncExternalStore } from 'react'

// Operator/dev-style settings that persist across reloads but aren't tied
// to the cartridge progression layer. Currently holds the vision tier
// (the suit/sensor degradation level applied to Carcosa). Kept in its
// own storage key so loadState.ts doesn't need a version bump every time
// a new dev toggle lands here.

export type VisionTier = 0 | 1 | 2 // 0=vertices, 1=wireframe, 2=full

export const DEFAULT_VISION_TIER: VisionTier = 2
export const DEFAULT_POST_PROCESSING = true

const STORAGE_KEY = 'gv:settings'
const STORAGE_VERSION = 2

interface StoredSettings {
  v: number
  visionTier: VisionTier
  postProcessing: boolean
}

interface State {
  visionTier: VisionTier
  postProcessing: boolean
}

function isVisionTier(v: unknown): v is VisionTier {
  return v === 0 || v === 1 || v === 2
}

function readStorage(): State {
  const fallback: State = { visionTier: DEFAULT_VISION_TIER, postProcessing: DEFAULT_POST_PROCESSING }
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<StoredSettings>
    if (parsed?.v !== STORAGE_VERSION) return fallback
    return {
      visionTier: isVisionTier(parsed.visionTier) ? parsed.visionTier : DEFAULT_VISION_TIER,
      postProcessing: typeof parsed.postProcessing === 'boolean' ? parsed.postProcessing : DEFAULT_POST_PROCESSING,
    }
  } catch {
    return fallback
  }
}

function writeStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const payload: StoredSettings = { v: STORAGE_VERSION, visionTier: state.visionTier, postProcessing: state.postProcessing }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota exceeded or private-mode storage refusal.
  }
}

let state: State = readStorage()
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

const tierSnapshotRef = { value: state.visionTier }
const postSnapshotRef = { value: state.postProcessing }
function getTierSnapshot(): VisionTier { return tierSnapshotRef.value }
function getPostSnapshot(): boolean { return postSnapshotRef.value }

export function setVisionTier(tier: VisionTier): void {
  if (state.visionTier === tier) return
  state = { ...state, visionTier: tier }
  tierSnapshotRef.value = tier
  writeStorage()
  notify()
}

export function getVisionTier(): VisionTier {
  return state.visionTier
}

export function useVisionTier(): VisionTier {
  return useSyncExternalStore(subscribe, getTierSnapshot, getTierSnapshot)
}

export function setPostProcessing(on: boolean): void {
  if (state.postProcessing === on) return
  state = { ...state, postProcessing: on }
  postSnapshotRef.value = on
  writeStorage()
  notify()
}

export function getPostProcessing(): boolean {
  return state.postProcessing
}

export function usePostProcessing(): boolean {
  return useSyncExternalStore(subscribe, getPostSnapshot, getPostSnapshot)
}
