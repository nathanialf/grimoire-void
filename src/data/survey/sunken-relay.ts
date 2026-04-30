import type { SurveyTemplate } from '../../types'

export const sunkenRelay: SurveyTemplate = {
  kind: 'survey',
  pageNumber: '042',
  drift: 0.66,
  slug: 'sunken-relay',
  filename: 'survey-sunken-relay-c4424.survey',
  filetype: 'SURVEY',
  author: 'Survey Division',
  sharedWith: ['Sector 9 — Operations Planning'],
  meta: [
    { label: 'Phase', value: 'Closed · Recovery' },
    { label: 'Status', value: 'Final' },
  ],
  header: {
    classification: 'Derelict Installation — Hazard Level: Severe',
    title: 'The Sunken Relay',
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
    {
      heading: 'Points of Interest',
      blocks: [
        {
          type: 'table',
          columns: ['Marker', 'Location', 'Notes'],
          rows: [
            ['A1', 'Main Antenna Array', 'Collapsed. Residual EM emissions detected.'],
            ['A2', 'Operations Center', 'Partially flooded. Data cores may be recoverable.'],
            ['B1', 'Crew Quarters', 'Sealed since Cycle 4400. Bio-hazard likely.'],
            ['B2', 'Reactor Chamber', 'AVOID. Unstable void-matter containment.'],
            ['C1', 'Docking Bay', 'Structural integrity compromised. One shuttle remains.'],
          ],
        },
      ],
    },
  ],
  missionStats: {
    title: 'Site Parameters',
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
  timeline: [],
  casualties: [],
  recommendations: [],
  footer: {
    viewingHistory: [
      { who: 'Sector 9 Salvage', when: 'C4427 D192 · 08:00' },
      { who: 'A. Vex (last on-site)', when: 'C4417 D085 · 03:30' },
      { who: 'archive.cartography', when: 'C4422 D118 · 11:00' },
    ],
  },
}
