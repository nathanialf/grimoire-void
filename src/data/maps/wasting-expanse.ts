import type { MapData } from '../../types'

export const wastingExpanse: MapData = {
  pageNumber: '058',
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
  ],
  poi: [
    { marker: 'W1', name: 'The Glass Flats', desc: 'Fused silicate plain. Surface temperature exceeds safe limits during solar peak.' },
    { marker: 'W2', name: 'Relay Station Omicron-7', desc: 'Submerged derelict. See entry 042 for detailed survey.' },
    { marker: 'W3', name: 'The Processional', desc: 'Linear arrangement of monolithic structures. Origin unknown. Possibly pre-Compact.' },
    { marker: 'W4', name: 'Sinkfield Alpha', desc: 'Gravitational anomaly zone. Equipment failure rate: 80%. Avoid.' },
    { marker: 'W5', name: 'Outpost Kaya (Abandoned)', desc: 'Former forward operating base. Evacuated Cycle 4418. May contain cached supplies.' },
    { marker: 'W6', name: 'The Wound', desc: 'Planetary fissure of unknown depth. Void-matter emissions detected. RESTRICTED.' },
  ],
}
