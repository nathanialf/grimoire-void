import type { ArtifactTemplate } from '../../types'

// STUB — chrome is final, body is scaffolded for expansion.
// Ambient (no pedestal, no attachedTo) so it's visible from first boot.
// Documents the consumable a player loads into the Recording Aperture.

export const cartridge: ArtifactTemplate = {
  kind: 'artifact',
  pageNumber: '003',
  drift: 0.07,
  slug: 'cartridge',
  filename: 'issue-cartridge-mk-i.artifact',
  filetype: 'ARTIFACT',
  author: 'Archive Custody',
  sharedWith: ['Sector 9 — All Hands'],
  meta: [
    { label: 'Class', value: 'II · Field Issue' },
    { label: 'Custody', value: 'Active Service' },
  ],
  header: {
    classification: 'Recording Medium — Rewrite Needed',
    title: 'Cartridge',
    tags: ['equipment', 'archive issue', 'recording medium', 'aperture-paired'],
  },
  image: {
    aspect: 'square',
    src: '/images/cartridge.svg',
    alt: 'Cartridge — face elevation and three-quarter wireframe diagrams',
    caption: 'Fig. 03 — Cartridge, Mark I. Face elevation (top) and ¾ angle (bottom); spine carries the slug title once bound.',
  },
  sections: [
    {
      heading: 'Medium Overview',
      blocks: [
        {
          type: 'paragraph',
          text: 'A cartridge is the single-doc recording medium issued in pair with the Recording Aperture. It is dispensed blank from the cabinet adjacent to the aperture rack, accepts at most one slug, and retains every fragment written against that slug for the duration of its custody. Cartridges are not erasable, not reassignable, and not portable between operatives without re-accession.',
        },
      ],
    },
    {
      heading: 'Operating Notes',
      blocks: [
        {
          type: 'paragraph',
          text: 'A cartridge becomes bound the first time it is presented to a node — that node\'s slug is written into the cart\'s spine, and from that moment forward the cart will refuse fragments addressed to any other slug. Until the bind, the spine reads BLANK and the aperture display reads in kind. Once bound, the spine carries the slug title and the cart\'s face is canonised against the slug\'s seed pattern.',
        },
      ],
    },
  ],
  statBlocks: [
    {
      title: 'Medium Profile',
      stats: [
        { label: 'Class', value: 'II Field' },
        { label: 'Type', value: 'Cartridge — Single Slug' },
        { label: 'Capacity', value: '1 slug' },
        { label: 'Bind', value: 'First scan' },
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
