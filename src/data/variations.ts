// Carcosa variations. Each variation is a hand-authored layout with a
// bound set of scan nodes. Variations not in BOOT_VARIATIONS are gated
// behind a keyword the player must read out of the wiki and type into
// the variant terminal (case-insensitive exact match).
//
// Per spec (variations-and-terminal.md): "no browseable list of
// undiscovered variations." The terminal lists known variations as
// click-to-load entries, but the only way to *discover* a new variation
// is to enter the right keyword as text.

export interface VariationNode {
  id: string
  // Doc slug this node binds the held cart to. First scan binds the
  // blank cart; subsequent scans must match (wrong-cart refusal).
  slug: string
  position: [number, number, number]
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
    key: 'ironwood-tideline',
    title: 'IRONWOOD TIDELINE',
    nodes: [
      { id: 'iw-001', slug: 'test-cartridge', position: [-3.5, 1.4, -3] },
      { id: 'iw-002', slug: 'test-cartridge', position: [3.5, 1.4, -3] },
      { id: 'iw-003', slug: 'test-cartridge', position: [0, 1.4, 4] },
    ],
  },
  {
    key: 'glass-litany',
    title: 'GLASS LITANY',
    keyword: 'glass litany',
    nodes: [
      { id: 'gl-001', slug: 'glass-litany', position: [-4, 1.4, -2] },
      { id: 'gl-002', slug: 'glass-litany', position: [4, 1.4, -2] },
      { id: 'gl-003', slug: 'glass-litany', position: [0, 1.4, 5] },
    ],
  },
]

// Variations the player has access to from first boot. These are
// pre-seeded into the discovered set so the terminal isn't empty on a
// fresh save (and the first scan/dock loop is reachable without any
// reading first).
export const BOOT_VARIATIONS: string[] = ['ironwood-tideline']

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
