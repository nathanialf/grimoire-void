import type { ArtifactTemplate } from '../../types'

// Test / tutorial cartridge document. Bound to its own pedestal so the
// vertical-slice loop (dispense → scan → dock → canonize) doesn't have
// to overwrite an existing cart-bearing pedestal. Partial state is
// per-fragment: each of the three authored test-variation nodes
// (tv-001..003) declares an explicit reveal ref pointing at one of
// the doc's three prose blocks (Overview block 0, Operating Notes
// block 0, Operating Notes block 1). Scanning a specific node unlocks
// exactly that paragraph in the wiki regardless of how many other
// fragments are in the cart.
//
// `test-cartridge-notes` (a comm) is registered with attachedTo:
// 'test-cartridge', so completing this cart unlocks the attached ambient
// doc into the wiki — exercising the "completion may unlock an
// additional ambient lore document" rule from cartridges.md.

export const testCartridge: ArtifactTemplate = {
  kind: 'artifact',
  pageNumber: '006',
  drift: 0.12,
  slug: 'test-cartridge',
  filename: 'test-cartridge-fixture.artifact',
  filetype: 'ARTIFACT',
  author: 'Archive Custody',
  sharedWith: ['Sector 9 — All Hands'],
  meta: [
    { label: 'Class', value: 'II · Fixture' },
    { label: 'Custody', value: 'Test · Vertical Slice' },
  ],
  header: {
    classification: 'Test Fixture',
    title: 'Test Cartridge',
    tags: ['test', 'fixture', 'tutorial', 'cartridge'],
  },
  sections: [
    {
      heading: 'Overview',
      blocks: [
        {
          type: 'paragraph',
          text: 'A standing test fixture used to walk operators through the dispense / scan / dock cycle end-to-end. Three nodes are placed in the Ironwood Tideline variation; recovering all three completes the cart, two recovers the cart partially, one likewise.',
        },
      ],
    },
    {
      heading: 'Operating Notes',
      blocks: [
        {
          type: 'paragraph',
          text: 'Operators are expected to recognise the cart on dispense, carry it through the threshold, scan all three pegs, and return it to its pedestal before the shift clock expires. Partial returns are honoured; the cart can be retrieved later for completion across additional sessions.',
        },
        {
          type: 'paragraph',
          text: 'On full canonisation the attached ambient note (test-cartridge-notes) becomes part of the archive — present in the wiki, surfaced from the same docking event.',
        },
      ],
    },
  ],
  statBlocks: [
    {
      title: 'Cartridge Profile',
      stats: [
        { label: 'Class', value: 'II Fixture' },
        { label: 'Type', value: 'Test · Tutorial' },
        { label: 'Nodes', value: '3' },
        { label: 'Verb', value: 'Scan' },
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
