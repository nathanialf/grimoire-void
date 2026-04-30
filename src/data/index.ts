// Flat document registry. Both the App route table and the museum scene
// read from REGISTRY — wiki presence (route + sidebar entry) and museum
// presence (a pedestal cartridge) are deliberately separate concerns.
// To put a doc on a pedestal, add its slug to MUSEUM_PEDESTALS in
// src/museum/sceneConstants.ts; ambient docs simply omit themselves there.
//
// Routes are diegetic — they reflect what the institution catalogues each
// document as, not the underlying schema. Folder structure (this directory)
// expresses schema; routes express in-fiction taxonomy. The two are allowed
// to diverge: e.g. omicron-collapse is a COETemplate but lives at
// /lore/omicron-collapse because it's filed as institutional lore.

import type { ContentBlock, DocMedia, TemplateData } from '../types'
import { MUSEUM_PEDESTALS } from '../museum/sceneConstants'
import type { CartridgeState } from './loadState'

import { ariaVex } from './profile/aria-vex'
import { yaelMox } from './profile/yael-mox'
import { tmp2Profile } from './profile/tmp2-profile'
import { pallidWatcher } from './artifact/pallid-watcher'
import { greyfieldChoir } from './artifact/greyfield-choir'
import { hollowBlade } from './artifact/hollow-blade'
import { spectralCaul } from './artifact/spectral-caul'
import { thresholdAccords } from './artifact/threshold-accords'
import { recordingAperture } from './artifact/recording-aperture'
import { variantTerminal } from './artifact/variant-terminal'
import { tmp4Artifact } from './artifact/tmp4-artifact'
import { omicronCollapse } from './coe/omicron-collapse'
import { sableThreshold } from './coe/sable-threshold'
import { glassLitany } from './coe/glass-litany'
import { tmp3COE } from './coe/tmp3-coe'
import { tmp1Comm } from './comm/tmp1-comm'
import { vexDeploymentC4427 } from './comm/vex-deployment-c4427'
import { sunkenRelay } from './survey/sunken-relay'
import { outpostKaya } from './survey/outpost-kaya'
import { wastingExpanse } from './survey/wasting-expanse'
import { theMuseum } from './survey/the-museum'
import { tmp5Survey } from './survey/tmp5-survey'

// 'placeholder' / 'template' picks the ticker text variant; 'none' suppresses
// the ticker entirely (chrome pages use this; finalized docs can graduate
// from a placeholder/template ticker to 'none' here without a separate flag).
export type TickerVariant = 'placeholder' | 'template' | 'none'

export interface DocEntry {
  data: TemplateData
  route: string
  ticker: TickerVariant
  // Slug of a cartridge-bearing document this entry is conceptually filed
  // under. Used by ambient docs (those absent from MUSEUM_PEDESTALS) to
  // declare their relationship to a pedestal — the comm from Solenne to
  // Vex, for instance, is filed under the Aria Vex cartridge. Pedestals
  // can surface their attachments via `documentsAttachedTo(slug)` below.
  attachedTo?: string
}

export const REGISTRY: DocEntry[] = [
  { data: ariaVex,          route: '/personnel/aria-vex',         ticker: 'placeholder' },
  { data: vexDeploymentC4427, route: '/comm/vex-deployment-c4427', ticker: 'placeholder', attachedTo: 'aria-vex' },
  { data: yaelMox,          route: '/personnel/yael-mox',         ticker: 'placeholder' },
  { data: pallidWatcher,    route: '/bestiary/pallid-watcher',    ticker: 'placeholder' },
  { data: greyfieldChoir,   route: '/bestiary/greyfield-choir',   ticker: 'placeholder' },
  { data: hollowBlade,      route: '/artifact/hollow-blade',      ticker: 'placeholder' },
  { data: spectralCaul,     route: '/artifact/spectral-caul',     ticker: 'placeholder' },
  { data: recordingAperture, route: '/artifact/recording-aperture', ticker: 'none'        },
  { data: variantTerminal,  route: '/artifact/variant-terminal',  ticker: 'none'        },
  { data: sunkenRelay,      route: '/location/sunken-relay',      ticker: 'placeholder' },
  { data: outpostKaya,      route: '/location/outpost-kaya',      ticker: 'placeholder' },
  { data: wastingExpanse,   route: '/map/wasting-expanse',        ticker: 'placeholder' },
  { data: theMuseum,        route: '/location/the-museum',        ticker: 'none'        },
  { data: omicronCollapse,  route: '/lore/omicron-collapse',      ticker: 'placeholder' },
  { data: thresholdAccords, route: '/lore/threshold-accords',     ticker: 'placeholder' },
  { data: sableThreshold,   route: '/coe/sable-threshold',        ticker: 'placeholder' },
  { data: glassLitany,      route: '/coe/glass-litany',           ticker: 'placeholder' },
  { data: tmp1Comm,         route: '/comm/tmp1-comm',             ticker: 'template'    },
  { data: tmp2Profile,      route: '/personnel/tmp2-profile',     ticker: 'template'    },
  { data: tmp3COE,          route: '/coe/tmp3-coe',               ticker: 'template'    },
  { data: tmp4Artifact,     route: '/artifact/tmp4-artifact',     ticker: 'template'    },
  { data: tmp5Survey,       route: '/survey/tmp5-survey',         ticker: 'template'    },
]

export const REGISTRY_BY_SLUG: Map<string, DocEntry> = new Map(
  REGISTRY.map((e) => [e.data.slug, e]),
)

// All ambient docs filed under the given cartridge slug. The cartridge doc
// itself is excluded — only attached entries are returned.
export function documentsAttachedTo(slug: string): DocEntry[] {
  return REGISTRY.filter((e) => e.attachedTo === slug)
}

// Slugs that occupy a museum pedestal (i.e. cartridge-bearing). Computed
// once from MUSEUM_PEDESTALS — order doesn't matter for the visibility
// filter, only set membership.
const CARTRIDGE_SLUGS: Set<string> = new Set(
  MUSEUM_PEDESTALS.filter((s): s is string => s !== null),
)

export function isCartridgeDoc(slug: string): boolean {
  return CARTRIDGE_SLUGS.has(slug)
}

// Wiki-visibility gate based on cartridge load state.
//   - Cartridge doc: visible while its pedestal is partial or complete;
//     hidden when 'absent'.
//   - Attached ambient doc: visible only when the parent cartridge is
//     'complete'. Per documents.md, ambient docs have no partial state —
//     they appear all-or-nothing on full cartridge insertion.
//   - Standalone ambient doc (no attachedTo, not a cartridge): always
//     visible — unlocked at first boot. Used for archive-fixture entries
//     that document the player's instruments rather than the world (e.g.
//     the Recording Aperture, the Variant Terminal).
export function isDocVisible(
  entry: DocEntry,
  states: Record<string, CartridgeState>,
): boolean {
  const slug = entry.data.slug
  if (CARTRIDGE_SLUGS.has(slug)) {
    return (states[slug] ?? 'complete') !== 'absent'
  }
  if (entry.attachedTo) {
    return (states[entry.attachedTo] ?? 'complete') === 'complete'
  }
  return true
}

// Best-effort title resolver for the cartridge label / sidebar etc. Each
// template kind has its own primary heading field; this picks the right
// one rather than forcing every kind to expose `title`.
export function titleOf(data: TemplateData): string {
  switch (data.kind) {
    case 'profile': return data.name
    case 'comm':    return data.title
    case 'coe':     return data.title
    case 'artifact':
    case 'survey':  return data.header.title
  }
}

// Walks every content-block-bearing field on the document, regardless of
// kind. Returns a flat list — order within isn't meaningful, this is for
// scanning (deriveMedia). New text-bearing fields on a kind go here so
// derivation stays accurate; the type system keeps this honest because
// missing kinds will fail the exhaustive switch.
function blocksOf(doc: TemplateData): ContentBlock[] {
  switch (doc.kind) {
    case 'comm':
      return doc.body
    case 'profile':
      return [...doc.dossier, ...doc.sections.flatMap((s) => s.blocks)]
    case 'coe':
      return [
        ...doc.issueSummary,
        ...doc.customerImpact,
        ...doc.lessonsLearned,
      ]
    case 'artifact':
      return doc.sections.flatMap((s) => s.blocks)
    case 'survey':
      return doc.sections.flatMap((s) => s.blocks)
  }
}

// Canonical media-row ordering for the header chrome.
const MEDIA_PRESENCE: DocMedia[] = ['text', 'image', 'audio', 'video']

// Derives `media: DocMedia[]` from what the document actually contains.
// Authors no longer hand-list this — drop in an image/audio/video
// ContentBlock and the header indicator updates automatically. Top-level
// header images on artifact/survey templates also count toward `image`.
//
// `text` is always present in practice (every doc has prose chrome and at
// least one paragraph block somewhere); explicitly including it here keeps
// the indicator stable even for an unusual doc with only image blocks.
export function deriveMedia(doc: TemplateData): DocMedia[] {
  const found = new Set<DocMedia>(['text'])
  for (const b of blocksOf(doc)) {
    if (b.type === 'image' || b.type === 'audio' || b.type === 'video') {
      found.add(b.type)
    }
  }
  if ((doc.kind === 'artifact' || doc.kind === 'survey') && doc.image?.src) {
    found.add('image')
  }
  return MEDIA_PRESENCE.filter((m) => found.has(m))
}

// Deterministic 32-bit FNV-1a hash over the slug. Used to seed the
// procedural cartridge so a document's appearance is stable regardless of
// which pedestal slot it occupies (or whether MUSEUM_PEDESTALS gets
// reordered later).
export function hashSlug(slug: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
