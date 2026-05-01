import { useSyncExternalStore } from 'react'

// Per-session held inventory. Distinct from the canonized pedestal state
// (`loadState.ts`) because anything in the player's hand is intentionally
// ephemeral: refresh, derez, or walking through EXIT all wipe the held
// cart. Only docking into a pedestal commits a cart's contents — and that
// path lives in loadState.ts (deferred work).
//
// Pure in-memory: no localStorage, no sessionStorage. The browser refresh
// is itself a "leaving" event by spec.

// A single cartridge held by the player. `slug` is null while the cart is
// blank; the first scan binds it to the scanned node's parent doc-slug,
// and subsequent scans must match (wrong-cart refusal). `gathered` keys
// are node IDs — placeholder format until real node authoring lands.
export type Cartridge = {
  slug: string | null
  gathered: Record<string, boolean>
}

export type Inventory = {
  tool: { equipped: boolean }
  cart: Cartridge | null
}

const INITIAL: Inventory = {
  tool: { equipped: false },
  cart: null,
}

let state: Inventory = INITIAL
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

function getSnapshot(): Inventory {
  return state
}

// Replace state on every mutation — never mutate in place. The
// useSyncExternalStore equality check skips re-renders when the snapshot
// reference is unchanged, so an in-place edit would be invisible to
// subscribed components.
export function useInventory(): Inventory {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function pickUpTool(): void {
  if (state.tool.equipped) return
  state = { ...state, tool: { equipped: true } }
  notify()
}

// Returns false when the player already holds a cart — the dispenser is
// invariant-bound to one blank cart in the world at a time, and since the
// player is the only carrier, "already held" subsumes the invariant.
export function dispenseCart(): boolean {
  if (state.cart) return false
  state = { ...state, cart: { slug: null, gathered: {} } }
  notify()
  return true
}

export type ScanResult = 'ok' | 'wrong-cart' | 'no-cart' | 'already-gathered'

// First scan on a blank cart binds the cart's slug to the node's slug.
// Subsequent scans on a bound cart must match. Re-scanning an already-
// gathered node is a no-op success-ish ('already-gathered') so the HUD
// can suppress the prompt without firing a state update.
export function scanNode(nodeId: string, nodeSlug: string): ScanResult {
  const cart = state.cart
  if (!cart) return 'no-cart'
  if (cart.slug !== null && cart.slug !== nodeSlug) return 'wrong-cart'
  if (cart.gathered[nodeId]) return 'already-gathered'
  state = {
    ...state,
    cart: {
      slug: cart.slug ?? nodeSlug,
      gathered: { ...cart.gathered, [nodeId]: true },
    },
  }
  notify()
  return 'ok'
}

// Player wipe — clears the held cart but leaves the tool equipped. Called
// at the START of runDerezThen / runFadeThen so the change is hidden in
// the visual chaos rather than visible during the cover-page transition.
export function derez(): void {
  if (!state.cart) return
  state = { ...state, cart: null }
  notify()
}

// Pulls the current cart's payload off and clears the held slot. The
// caller (museum dock-trigger) is responsible for writing it into the
// pedestal store via setCartridge. Decoupled so inventory.ts doesn't
// import loadState.
export function dockCart(): { slug: string | null; gathered: Record<string, boolean> } | null {
  const cart = state.cart
  if (!cart) return null
  const payload = { slug: cart.slug, gathered: cart.gathered }
  state = { ...state, cart: null }
  notify()
  return payload
}

// Re-binds an in-hand cart to a known slug pre-populated from a pedestal
// (the inverse of dockCart). Used when the player retrieves a partial
// cart they previously docked. Refuses if the player already holds a
// cart so the one-cart-at-a-time invariant survives.
export function pickUpPartialCart(slug: string, gathered: Record<string, true>): boolean {
  if (state.cart) return false
  const cleaned: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(gathered)) if (v) cleaned[k] = true
  state = { ...state, cart: { slug, gathered: cleaned } }
  notify()
  return true
}

// Test/debug helper — fully resets the inventory to its initial blank
// state. Not used in normal play.
export function resetInventory(): void {
  state = INITIAL
  notify()
}
