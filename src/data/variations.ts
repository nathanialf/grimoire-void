// Carcosa variations. Each variation is a hand-authored layout with a
// bound set of scan nodes. Variations not in BOOT_VARIATIONS are gated
// behind a keyword the player must read out of the wiki and type into
// the variant terminal (case-insensitive exact match).
//
// Per spec (variations-and-terminal.md): "no browseable list of
// undiscovered variations." The terminal lists known variations as
// click-to-load entries, but the only way to *discover* a new variation
// is to enter the right keyword as text.

// A specific position within a doc that a fragment unlocks. Authors
// declare these per-node so scanning a particular node in Carcosa
// reveals an exact paragraph, timeline entry, action item, etc. — the
// wiki's partial state composes from the union of revealed positions
// across the slot's gathered nodes, not from a fraction of progress.
//
// `sections` carries `sectionIndex` + `blockIndex` because the
// section-bearing kinds (profile, artifact, survey) nest blocks inside
// named sections, so a flat index would lose the section binding. The
// other fields are flat top-level arrays on their respective kinds.
//
// `incidentResponseAnalysis` uses index 0 / 1 / 2 to address ttd / tte
// / ttr respectively, since the field is a fixed three-slot object.
export type RevealRef =
  | { field: 'body'; index: number }
  | { field: 'dossier'; index: number }
  | { field: 'sections'; sectionIndex: number; blockIndex: number }
  | { field: 'serviceRecord'; index: number }
  | { field: 'issueSummary'; index: number }
  | { field: 'customerImpact'; index: number }
  | { field: 'lessonsLearned'; index: number }
  | { field: 'incidentResponseAnalysis'; index: 0 | 1 | 2 }
  | { field: 'timeline'; index: number }
  | { field: 'fiveWhys'; index: number }
  | { field: 'actionItems'; index: number }
  | { field: 'relatedItems'; index: number }
  | { field: 'casualties'; index: number }
  | { field: 'recommendations'; index: number }

export interface VariationNode {
  id: string
  // Doc slug this node binds the held cart to. First scan binds the
  // blank cart; subsequent scans must match (wrong-cart refusal).
  slug: string
  position: [number, number, number]
  // Doc positions this fragment unlocks. May be empty (the node still
  // counts toward dock completion but doesn't reveal anything in the
  // wiki) or carry multiple refs (a single fragment surfaces several
  // pieces of the doc at once). Reveal refs across all gathered nodes
  // are unioned at render time — order is not significant; the doc's
  // own array order is what the wiki preserves.
  reveals?: RevealRef[]
}

export interface Variation {
  // Stable internal key used for persistence and routing.
  key: string
  // Display title shown in the terminal's known-variations list.
  title: string
  // Keyword the player types to unlock this variation. Case-insensitive
  // exact match. Boot variations may omit it.
  keyword?: string
  // The scan nodes inside this variation. All bound to the same slug
  // for the slice; future variations may mix slugs to exercise the
  // wrong-cart refusal more directly.
  nodes: VariationNode[]
}

export const VARIATIONS: Variation[] = [
  {
    key: 'test-variation',
    title: 'TEST VARIATION',
    nodes: [
      // Primary subject: test-cartridge. Three nodes, each pointing at
      // one of the doc's three prose blocks (Overview ×1, Operating
      // Notes ×2). Together they cover the whole body.
      {
        id: 'tv-001',
        slug: 'test-cartridge',
        position: [-3.5, 1.4, -3],
        reveals: [{ field: 'sections', sectionIndex: 0, blockIndex: 0 }],
      },
      {
        id: 'tv-002',
        slug: 'test-cartridge',
        position: [3.5, 1.4, -3],
        reveals: [{ field: 'sections', sectionIndex: 1, blockIndex: 0 }],
      },
      {
        id: 'tv-003',
        slug: 'test-cartridge',
        position: [0, 1.4, 4],
        reveals: [{ field: 'sections', sectionIndex: 1, blockIndex: 1 }],
      },
      // Stray glass-litany nodes — hybrid theming per
      // variations-and-terminal.md: each variation has a primary
      // subject but contains stray nodes from other subjects too, so
      // a slug's full fragment count may be spread across multiple
      // variations.
      {
        id: 'gl-010',
        slug: 'glass-litany',
        position: [-7, 1.4, 7],
        reveals: [
          { field: 'actionItems', index: 2 },
          { field: 'actionItems', index: 3 },
          { field: 'relatedItems', index: 0 },
        ],
      },
      {
        id: 'gl-011',
        slug: 'glass-litany',
        position: [7, 1.4, 7],
        reveals: [
          { field: 'actionItems', index: 4 },
          { field: 'actionItems', index: 5 },
          { field: 'relatedItems', index: 1 },
        ],
      },
      {
        id: 'gl-012',
        slug: 'glass-litany',
        position: [0, 1.4, 10],
        reveals: [
          { field: 'relatedItems', index: 2 },
          { field: 'relatedItems', index: 3 },
          { field: 'incidentResponseAnalysis', index: 2 },
        ],
      },
    ],
  },
  {
    key: 'glass-litany',
    title: 'GLASS LITANY',
    keyword: 'glass litany',
    nodes: [
      {
        id: 'gl-001',
        slug: 'glass-litany',
        position: [-4, 1.4, -2],
        reveals: [
          { field: 'issueSummary', index: 0 },
          { field: 'timeline', index: 0 },
        ],
      },
      {
        id: 'gl-002',
        slug: 'glass-litany',
        position: [4, 1.4, -2],
        reveals: [
          { field: 'issueSummary', index: 1 },
          { field: 'timeline', index: 1 },
        ],
      },
      {
        id: 'gl-003',
        slug: 'glass-litany',
        position: [0, 1.4, 5],
        reveals: [
          { field: 'customerImpact', index: 0 },
          { field: 'timeline', index: 2 },
          { field: 'incidentResponseAnalysis', index: 0 },
        ],
      },
      {
        id: 'gl-004',
        slug: 'glass-litany',
        position: [-8, 1.4, 1],
        reveals: [
          { field: 'customerImpact', index: 1 },
          { field: 'timeline', index: 3 },
          { field: 'fiveWhys', index: 0 },
        ],
      },
      {
        id: 'gl-005',
        slug: 'glass-litany',
        position: [8, 1.4, 1],
        reveals: [
          { field: 'customerImpact', index: 2 },
          { field: 'timeline', index: 4 },
          { field: 'fiveWhys', index: 1 },
        ],
      },
      {
        id: 'gl-006',
        slug: 'glass-litany',
        position: [-6, 1.4, 9],
        reveals: [
          { field: 'lessonsLearned', index: 0 },
          { field: 'timeline', index: 5 },
          { field: 'fiveWhys', index: 2 },
        ],
      },
      {
        id: 'gl-007',
        slug: 'glass-litany',
        position: [6, 1.4, 9],
        reveals: [
          { field: 'lessonsLearned', index: 1 },
          { field: 'timeline', index: 6 },
          { field: 'fiveWhys', index: 3 },
          { field: 'incidentResponseAnalysis', index: 1 },
        ],
      },
      {
        id: 'gl-008',
        slug: 'glass-litany',
        position: [0, 1.4, 13],
        reveals: [
          { field: 'lessonsLearned', index: 2 },
          { field: 'timeline', index: 7 },
          { field: 'fiveWhys', index: 4 },
        ],
      },
      {
        id: 'gl-009',
        slug: 'glass-litany',
        position: [-3, 1.4, -7],
        reveals: [
          { field: 'actionItems', index: 0 },
          { field: 'actionItems', index: 1 },
        ],
      },
    ],
  },
]

// nodeId → reveal refs lookup. Built once at module load so the wiki
// renderer's per-frame lookup is constant-time. Nodes without an
// authored `reveals` array are absent from the map (they still count
// toward dock completion but contribute no doc-side reveals).
const NODE_REVEALS: Map<string, RevealRef[]> = (() => {
  const m = new Map<string, RevealRef[]>()
  for (const v of VARIATIONS) {
    for (const n of v.nodes) {
      if (n.reveals && n.reveals.length > 0) m.set(n.id, n.reveals)
    }
  }
  return m
})()

// Returns the union of reveal refs for every gathered node. Caller
// passes the slot's `gathered` map (keys = node IDs, values = true);
// duplicate refs across multiple nodes are passed through unchanged
// because applyPartial dedupes via per-field index Sets anyway.
export function revealsForGathered(gathered: Record<string, true | boolean>): RevealRef[] {
  const out: RevealRef[] = []
  for (const id in gathered) {
    if (!gathered[id]) continue
    const r = NODE_REVEALS.get(id)
    if (r) out.push(...r)
  }
  return out
}

// All authored fragment-node IDs for a given doc slug across every
// variation. The dock-time completion check uses this so a cart whose
// fragments span multiple variations only canonises 'complete' when
// every authored node is in `gathered`, regardless of which variation
// the player happens to be in when docking.
export function fragmentNodeIdsForSlug(slug: string): string[] {
  const ids: string[] = []
  for (const v of VARIATIONS) {
    for (const node of v.nodes) if (node.slug === slug) ids.push(node.id)
  }
  return ids
}

// Variations the player has access to from first boot. These are
// pre-seeded into the discovered set so the terminal isn't empty on a
// fresh save (and the first scan/dock loop is reachable without any
// reading first).
export const BOOT_VARIATIONS: string[] = ['test-variation']

const VARIATIONS_BY_KEY: Map<string, Variation> = new Map(
  VARIATIONS.map((v) => [v.key, v]),
)

export function findVariationByKey(key: string): Variation | null {
  return VARIATIONS_BY_KEY.get(key) ?? null
}

// Case-insensitive exact-match lookup. Used by the terminal's keyword
// input. Returns null on no match (the player sees a red status flash
// in the terminal UI). Boot variations are matched too — typing
// 'IRONWOOD TIDELINE' is a no-op but should not reject.
export function findVariationByKeyword(input: string): Variation | null {
  const needle = input.trim().toLowerCase()
  if (!needle) return null
  for (const v of VARIATIONS) {
    if (v.keyword && v.keyword.toLowerCase() === needle) return v
    if (v.title.toLowerCase() === needle) return v
  }
  return null
}
