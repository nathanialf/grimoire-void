import type { ContentBlock, Section, TemplateData } from '../types'

// Sentinel block appended after the visible prefix. Reuses the existing
// paragraph kind so all five renderers handle it without a new shape.
// Future styling can swap this for a dedicated 'gap' ContentBlock once
// every kind's renderBlocks gains support, but the sentinel string is
// recognisable enough on its own per the wiki's gap rules (visible but
// non-enumerated).
const GAP_TEXT = '■■■ FRAGMENT MISSING ■■■'

function gapBlock(): ContentBlock {
  return { type: 'paragraph', text: GAP_TEXT }
}

function cropBlocks(blocks: ContentBlock[], fraction: number): ContentBlock[] {
  if (blocks.length === 0) return blocks
  const visible = Math.max(0, Math.min(blocks.length, Math.ceil(blocks.length * fraction)))
  if (visible === blocks.length) return blocks
  return [...blocks.slice(0, visible), gapBlock()]
}

function cropSections(sections: Section[], fraction: number): Section[] {
  return sections.map((s) => ({ ...s, blocks: cropBlocks(s.blocks, fraction) }))
}

// Shrinks a document's body to the first `fraction` of its content,
// replacing trailing material on each block-list with a single sentinel
// paragraph. Mirrors blocksOf in src/data/index.ts so the set of body
// fields stays consistent — if a new content-bearing field is added to
// a kind there, it should be cropped here too.
//
// The sentinel approach is intentional: the wiki's gap rules forbid
// enumerating *what* is missing (no field labels, no fragment counts),
// only *that* something is missing. A single block per cropped section
// satisfies that rule without leaking shape information about the
// underlying schema.
export function applyPartial(doc: TemplateData, fraction: number): TemplateData {
  const f = Math.max(0, Math.min(1, fraction))
  if (f >= 1) return doc
  switch (doc.kind) {
    case 'comm':
      return { ...doc, body: cropBlocks(doc.body, f) }
    case 'profile':
      return {
        ...doc,
        dossier: cropBlocks(doc.dossier, f),
        sections: cropSections(doc.sections, f),
      }
    case 'coe':
      return {
        ...doc,
        issueSummary: cropBlocks(doc.issueSummary, f),
        customerImpact: cropBlocks(doc.customerImpact, f),
        lessonsLearned: cropBlocks(doc.lessonsLearned, f),
      }
    case 'artifact':
      return { ...doc, sections: cropSections(doc.sections, f) }
    case 'survey':
      return { ...doc, sections: cropSections(doc.sections, f) }
  }
}
