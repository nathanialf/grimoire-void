import type { ArtifactTemplate } from '../../types'

// STUB — chrome is final, body is scaffolded for expansion.
// Ambient (no pedestal, no attachedTo) so it's visible from first boot.
// Documents the field instrument the player carries into Carcosa.

export const recordingAperture: ArtifactTemplate = {
  kind: 'artifact',
  pageNumber: '002',
  drift: 0.06,
  slug: 'recording-aperture',
  filename: 'issue-recording-aperture-mk-i.artifact',
  filetype: 'ARTIFACT',
  author: 'Archive Custody',
  sharedWith: ['Sector 9 — All Hands'],
  meta: [
    { label: 'Class', value: 'II · Field Issue' },
    { label: 'Custody', value: 'Active Service' },
  ],
  header: {
    classification: 'Standard Issue — Recording Instrument',
    title: 'The Recording Aperture',
    tags: ['equipment', 'archive issue', 'field instrument', 'cartridge interface'],
  },
  sections: [
    {
      heading: 'Instrument Overview',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Recording Aperture is the standard hand-carried instrument issued for archival field work. It accepts a single cartridge at a time and writes one fragment per node engaged, refusing any node not addressed to the cart currently seated. Operatives are expected to recognise it on sight, return it to its rack between sessions, and report any deviation from the foregoing to Archive Custody.',
        },
      ],
    },
    {
      heading: 'Operating Notes',
      blocks: [
        {
          type: 'paragraph',
          text: 'The aperture indicates its state through the housing display: the seated cart\'s designation, the count of fragments written, and — when no cart is present — a flat refusal. There is no override. There is no recovery channel for fragments not written here.',
        },
      ],
    },
  ],
  statBlocks: [
    {
      title: 'Instrument Profile',
      stats: [
        { label: 'Class', value: 'II Field' },
        { label: 'Type', value: 'Recording — Aperture' },
        { label: 'Capacity', value: '1 cart' },
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
