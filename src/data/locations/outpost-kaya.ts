import type { LocationData } from '../../types'

export const outpostKaya: LocationData = {
  pageNumber: '048',
  header: {
    classification: 'Abandoned Installation — Hazard Level: Moderate',
    title: 'Outpost Kaya',
    subtitle: 'Forward operating base, Wasting Expanse sector W5. Evacuated Cycle 4418.',
    tags: ['abandoned', 'scavenger activity', 'unauthorized occupation', 'expanse perimeter'],
  },
  image: {
    aspect: 'wide',
    placeholderLabel: '[ reconnaissance photo: outpost kaya, aerial survey ]',
    caption: 'Fig. 48 — Outpost Kaya, Cycle 4422 drone flyover. Note structural damage to east wing and unauthorized surface modifications.',
  },
  sections: [
    {
      heading: 'Survey Report',
      blocks: [
        {
          type: 'paragraph',
          text: "Outpost Kaya was established in Cycle 4413 as a forward operating base for Meridian Compact survey teams mapping the region that would later become the [[Wasting Expanse|/map/wasting-expanse]]. Positioned at grid reference W5 on the current Expanse chart, the outpost served as a logistics hub, resupply point, and emergency shelter for deep-field patrols operating in the planetoid's equatorial zone.",
        },
        {
          type: 'paragraph',
          text: "The outpost was evacuated during the immediate aftermath of the [[Omicron Collapse|/lore/omicron-collapse]], when the expanding void-contamination zone rendered its position untenable. Evacuation was orderly — personnel and critical equipment were extracted over a 36-hour window. Non-essential supplies, structural fixtures, and the outpost's backup communication array were left in place under the assumption that the facility would be reoccupied once containment was established.",
        },
        {
          type: 'paragraph',
          text: 'Containment was never established. Outpost Kaya has remained officially abandoned for four cycles. However, Cycle 4422 reconnaissance surveys detected signs of recent unauthorized occupation: replacement power cells in the backup generator, cleared debris in the main corridor, and what appears to be a crude perimeter alarm system constructed from salvaged sensor components. The identity of the occupants is unknown.',
        },
        {
          type: 'quote',
          text: "Someone's living there. Or something is pretending to live there. The food wrappers were human — ration packs, civilian grade, not Compact issue. But the boot prints in the dust were all the same size. Every single one. Fourteen different trails, one pair of feet.",
          source: 'Reconnaissance Report 4422-W5, Drone Operator Essi Tan',
        },
      ],
    },
    {
      heading: 'Current Status',
      blocks: [
        {
          type: 'paragraph',
          text: "The outpost sits approximately 12 kilometers inside the Expanse perimeter — close enough to avoid the deepest void-contamination zones but well within [[Greyfield Choir|/bestiary/greyfield-choir]] patrol range. Three separate Choir formations have been observed within 2 kilometers of the outpost during the past cycle. Whether the Choir's proximity is coincidental, attracted by the occupants' presence, or part of a broader territorial pattern is under active analysis.",
        },
        {
          type: 'paragraph',
          text: "Sector 9 has classified the outpost as a low-priority surveillance target. Resources are stretched thin, and the unauthorized occupants — whoever they are — have not interfered with Compact operations. A standing recommendation exists to investigate during the next scheduled patrol of the W5 grid sector, but no dedicated mission has been authorized.",
        },
        {
          type: 'paragraph',
          text: "Of note: the outpost's original communication array, left powered down during evacuation, was detected transmitting a repeating signal on a deprecated frequency during a Cycle 4421 sweep. The signal lasted eleven minutes before ceasing. Its content, when decoded, consisted of a single word repeated 4,417 times — the cycle number of the Omicron Collapse. No further transmissions have been detected.",
        },
      ],
    },
  ],
  poi: [
    { marker: 'K1', name: 'Main Habitation Module', desc: 'Intact. Signs of recent cleaning and occupation.' },
    { marker: 'K2', name: 'Supply Depot', desc: 'Partially looted. Non-essential Compact rations remain.' },
    { marker: 'K3', name: 'Communication Array', desc: 'Powered down. Source of anomalous Cy. 4421 transmission.' },
    { marker: 'K4', name: 'East Wing (Damaged)', desc: 'Structural collapse. Cause unclear — not consistent with weathering.' },
    { marker: 'K5', name: 'Perimeter Alarm Grid', desc: 'Unauthorized modification. Crude but functional sensor net.' },
  ],
  statBlocks: [
    {
      title: 'Location Profile',
      stats: [
        { label: 'Hazard', value: 'MODERATE', variant: 'accent' },
        { label: 'Type', value: 'Abandoned FOB' },
        { label: 'Grid Ref.', value: 'W5' },
        { label: 'Gravity', value: '0.3g' },
        { label: 'Atmo', value: 'Marginal' },
        { label: 'Void Level', value: 'Low-Moderate' },
        { label: 'Access', value: 'Unrestricted' },
        { label: 'Occupants', value: 'Unknown', variant: 'danger' },
      ],
    },
  ],
}
