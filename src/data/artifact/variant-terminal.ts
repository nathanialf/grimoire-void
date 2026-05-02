import type { ArtifactTemplate } from '../../types'

// STUB — chrome is final, body is scaffolded for expansion.
// Ambient (no pedestal, no attachedTo) so it's visible from first boot.
// Documents the wall-mounted terminal at the Carcosa threshold that
// loads variations by keyword.

export const variantTerminal: ArtifactTemplate = {
  kind: 'artifact',
  pageNumber: '004',
  drift: 0.09,
  slug: 'variant-terminal',
  filename: 'fixture-variant-terminal.artifact',
  filetype: 'ARTIFACT',
  author: 'Archive Custody',
  sharedWith: ['Sector 9 — All Hands'],
  meta: [
    { label: 'Class', value: 'II · Fixture' },
    { label: 'Custody', value: 'In Place · Threshold' },
  ],
  header: {
    classification: 'Archive Fixture — Rewrite Needed',
    title: 'Variant Terminal',
    tags: ['fixture', 'archive issue', 'threshold', 'variation loader'],
  },
  sections: [
    {
      heading: 'Fixture Overview',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Variant Terminal is the wall-mounted console immediately preceding the Carcosa threshold. It is the only sanctioned means by which a variation is loaded. The terminal accepts a textual keyword, validates against the present index of recognised variations, and — on match — opens passage to the named ruin. Variations once visited are retained for direct re-entry.',
        },
      ],
    },
    {
      heading: 'Operating Notes',
      blocks: [
        {
          type: 'paragraph',
          text: 'Keywords are not enumerated by the terminal. They are obtained from the archive itself — read out of documents in custody — and entered exactly. Approximate spellings, draft titles, and inferred names are not honoured. There is no list of unfound variations and there is no hint channel. The first recognised keyword in operator hands has historically been *Glass Litany*, recovered from accession notes; later operators have added other entries to the index by reading further.',
        },
      ],
    },
  ],
  statBlocks: [
    {
      title: 'Fixture Profile',
      stats: [
        { label: 'Class', value: 'II Fixture' },
        { label: 'Type', value: 'Console — Threshold' },
        { label: 'Input', value: 'Keyword' },
        { label: 'Match', value: 'Exact' },
      ],
    },
  ],
  footer: {
    viewingHistory: [
      { who: 'Archive Custody', when: 'C4427 D200 · 08:00' },
      { who: 'archive.accession', when: 'C4419 D045 · 06:00' },
    ],
  },
}
