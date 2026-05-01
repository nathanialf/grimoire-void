import type { SurveyTemplate } from '../../types'

// STUB — chrome is final, body is scaffolded for expansion.
// Ambient (no pedestal, no attachedTo) so it's visible from first boot.
// Documents the museum itself as a location: the room the player stands
// in, the pedestals around them, the threshold to Carcosa.

export const theMuseum: SurveyTemplate = {
  kind: 'survey',
  pageNumber: '004',
  drift: 0.04,
  slug: 'the-museum',
  filename: 'survey-the-museum.survey',
  filetype: 'SURVEY',
  author: 'Survey Division',
  sharedWith: ['Sector 9 — All Hands'],
  meta: [
    { label: 'Phase', value: 'Standing · Operational' },
    { label: 'Status', value: 'In Place' },
  ],
  header: {
    classification: 'Archive Facility — Rewrite Needed',
    title: 'The Museum',
    tags: ['archive', 'facility', 'standing site', 'threshold-adjacent'],
  },
  image: {
    aspect: 'square',
    src: '/images/the-museum-plan.svg',
    alt: 'Schematic floor plan of the museum, plan view, level 0.',
    caption: 'Sheet 004 — The Museum, plan view. Sixteen pedestals on a 4 × 4 grid; the east wall carries the Recording Aperture and the cartridge dispenser side by side; the Variant Terminal flanks the variation threshold on the north wall.',
  },
  sections: [
    {
      heading: 'Site Overview',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Museum is the standing exhibition floor of the archive — a single chamber laid out as a regular grid of pedestals, bracketed by a return egress on one wall and the variation threshold on the opposite wall. It is the floor on which all canonised material is held in physical custody, and the room from which all field excursions begin and conclude.',
        },
      ],
    },
    {
      heading: 'Layout Notes',
      blocks: [
        {
          type: 'paragraph',
          text: 'Each pedestal in the grid is keyed to a single document. A pedestal may stand empty, hold a partially seated cartridge, or hold a complete one. The east wall carries the [[Recording Aperture|/artifact/recording-aperture]] and the cartridge dispenser, side by side. The variation threshold is fronted by the [[Variant Terminal|/artifact/variant-terminal]] and is not locked — once a variation has been entered, it remains addressable.',
        },
      ],
    },
  ],
  timeline: [],
  casualties: [],
  recommendations: [],
  footer: {
    viewingHistory: [
      { who: 'Archive Custody', when: 'C4427 D200 · 08:00' },
      { who: 'archive.accession', when: 'C4419 D045 · 06:00' },
    ],
  },
}
