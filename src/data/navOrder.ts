import { REGISTRY, isDocVisible, titleOf } from './index'
import type { CartridgeState } from './loadState'

export interface NavEntry {
  label: string
  to: string
  pageNumber: string
  redacted?: boolean
}

// Chrome entries are always present (cover/blank/credits) or always shown as
// a placeholder (redacted). Their pageNumbers slot them into the page-number
// ordering the sidebar and prev/next buttons share, so redacted lands between
// 058 and 071 instead of being pinned next to credits.
export const CHROME_ENTRIES: NavEntry[] = [
  { label: 'Cover', to: '/cover', pageNumber: '000' },
  { label: '<UNTITLED>', to: '/blank', pageNumber: '001' },
  { label: '██████ ████████', to: '/redacted/067', pageNumber: '067', redacted: true },
  { label: 'Credits', to: '/credits', pageNumber: '999' },
]

export function buildNavEntries(states: Record<string, CartridgeState>): NavEntry[] {
  const wikiEntries: NavEntry[] = REGISTRY
    .filter((e) => isDocVisible(e, states))
    .map(({ data, route }) => ({
      label: titleOf(data),
      to: route,
      pageNumber: data.pageNumber,
    }))
  return [...CHROME_ENTRIES, ...wikiEntries].sort((a, b) =>
    a.pageNumber.localeCompare(b.pageNumber),
  )
}
