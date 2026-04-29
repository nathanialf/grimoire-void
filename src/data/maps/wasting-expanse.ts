import type { ArtifactTemplate } from '../../types'

export const wastingExpanse: ArtifactTemplate = {
  kind: 'artifact',
  pageNumber: '058',
  drift: 0.38,
  header: {
    classification: 'Regional Survey — Sector 7',
    title: 'The Wasting Expanse',
    subtitle: 'Planetoid XR-881, northern hemisphere survey zone',
    tags: ['survey', 'hostile environment', 'void-active', 'restricted access'],
  },
  image: {
    aspect: 'wide',
    placeholderLabel: '[ regional survey map: the wasting expanse, topographic overlay ]',
    caption: 'Fig. 58 — Composite orbital survey, Cycle 4421. Shaded regions indicate void-contamination above threshold.',
  },
  sections: [
    {
      heading: 'Region Overview',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Wasting Expanse designates a 400-kilometer survey zone on the northern hemisphere of planetoid XR-881, encompassing the primary operational theater for Sector 9 reconnaissance activities. The terrain is characterized by low-gravity silicate desert interspersed with frozen methane deposits and deep geological fissures that predate human arrival by an estimated 10,000 cycles.',
        },
        {
          type: 'paragraph',
          text: "Since the [[Omicron Collapse|/lore/omicron-collapse]], the region has exhibited accelerating geological instability. Surface formations shift measurably between survey passes, and subsurface sonar returns inconsistent readings — suggesting either rapid tectonic activity or spatial distortion affecting the planetoid's interior geometry. Navigation within the Expanse requires constant recalibration; maps older than one cycle are considered unreliable.",
        },
        {
          type: 'paragraph',
          text: 'The Wasting Expanse is classified as a hostile operating environment. All personnel entering the zone must carry minimum Class III psi-shielding, 72-hour survival provisions, and an active transponder registered with Sector 9 command. Solo operations are prohibited under standing order 4419-7.',
        },
      ],
    },
    {
      heading: 'Points of Interest',
      blocks: [
        {
          type: 'table',
          columns: ['Marker', 'Location', 'Notes'],
          rows: [
            ['W1', 'The Glass Flats', 'Fused silicate plain. Surface temperature exceeds safe limits during solar peak.'],
            ['W2', 'Relay Station Omicron-7', 'Submerged derelict. See [[The Sunken Relay|/location/sunken-relay]] for detailed survey.'],
            ['W3', 'The Processional', 'Linear arrangement of monolithic structures. Origin unknown. Possibly pre-Compact.'],
            ['W4', 'Sinkfield Alpha', 'Gravitational anomaly zone. Equipment failure rate: 80%. Avoid.'],
            ['W5', 'Outpost Kaya (Abandoned)', 'Former forward operating base. See [[Outpost Kaya|/location/outpost-kaya]].'],
            ['W6', 'The Wound', 'Planetary fissure of unknown depth. Void-matter emissions detected. RESTRICTED.'],
          ],
        },
      ],
    },
  ],
  statBlocks: [],
  footer: {
    media: ['text', 'image'],
    viewingHistory: [
      { who: 'Sector 9 Cmd', when: 'C4427 D192 · 06:00' },
      { who: 'Cartography Office', when: 'C4421 D310 · 14:00' },
      { who: 'archive.cartography', when: 'C4418 D250 · 09:00' },
    ],
  },
}
