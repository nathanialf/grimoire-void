import type { LocationData } from '../../types'

export const sunkenRelay: LocationData = {
  pageNumber: '042',
  header: {
    classification: 'Derelict Installation — Hazard Level: Severe',
    title: 'The Sunken Relay',
    subtitle: 'Relay Station Omicron-7, subsurface sector',
    tags: ['derelict', 'void-contaminated', 'restricted', 'salvage-priority'],
  },
  image: {
    aspect: 'wide',
    placeholderLabel: '[ cartographic survey: omicron-7 subsurface layout ]',
    caption: 'Fig. 42 — Composite sonar map, Cycle 4422 survey. Gray zones indicate unmapped regions.',
  },
  sections: [
    {
      heading: 'Survey Report',
      blocks: [
        {
          type: 'paragraph',
          text: "Relay Station Omicron-7 was a deep-space communications array operated by the Meridian Compact during Cycles 4380–4417. Following the [[Omicron Collapse|/lore/omicron-collapse]], the station's orbital trajectory decayed, and the structure partially submerged into the lithosphere of planetoid XR-881, a low-gravity body with an unstable crust of frozen methane and silicate dust.",
        },
        {
          type: 'paragraph',
          text: 'Current surveys indicate approximately 40% of the original structure remains accessible, though significant portions have been compromised by geological intrusion and what field teams describe as "spatial folding" — corridors that loop back on themselves or connect to sections that should not physically exist.',
        },
        {
          type: 'paragraph',
          text: 'The station is considered the primary site of the first [[Pallid Watcher|/bestiary/pallid-watcher]] encounter. Void-matter contamination levels remain elevated in the reactor chamber and surrounding sections. Recovery teams are advised to carry psi-shielding equipment rated for Class III exposure minimum.',
        },
      ],
    },
  ],
  poi: [
    { marker: 'A1', name: 'Main Antenna Array', desc: 'Collapsed. Residual EM emissions detected.' },
    { marker: 'A2', name: 'Operations Center', desc: 'Partially flooded. Data cores may be recoverable.' },
    { marker: 'B1', name: 'Crew Quarters', desc: 'Sealed since Cycle 4400. Bio-hazard likely.' },
    { marker: 'B2', name: 'Reactor Chamber', desc: 'AVOID. Unstable void-matter containment.' },
    { marker: 'C1', name: 'Docking Bay', desc: 'Structural integrity compromised. One shuttle remains.' },
  ],
  statBlocks: [
    {
      title: 'Location Profile',
      stats: [
        { label: 'Hazard', value: 'SEVERE', variant: 'danger' },
        { label: 'Type', value: 'Derelict' },
        { label: 'Depth', value: '1.2 km' },
        { label: 'Gravity', value: '0.3g' },
        { label: 'Atmo', value: 'Toxic' },
        { label: 'Void Level', value: 'High', variant: 'danger' },
        { label: 'Access', value: 'Restricted', variant: 'accent' },
        { label: 'Salvage', value: 'Priority', variant: 'accent' },
      ],
    },
  ],
}
