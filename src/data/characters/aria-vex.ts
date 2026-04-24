import type { CharacterData } from '../../types'

export const ariaVex: CharacterData = {
  pageNumber: '007',
  header: {
    classification: 'Operative — Class II',
    title: 'Aria Vex',
    subtitle: 'Void-touched field agent, Sector 9 deep reconnaissance',
    tags: ['operative', 'void-touched', 'psi-sensitive', 'active duty'],
  },
  image: {
    aspect: 'tall',
    placeholderLabel: '[ operative portrait: aria vex, field dress ]',
    caption: 'Fig. 7 — Operative Vex, post-debrief Cycle 4422. Note dermal scarring consistent with void exposure.',
  },
  sections: [
    {
      heading: 'Personnel Dossier',
      blocks: [
        {
          type: 'paragraph',
          text: "Aria Vex was recruited into the Meridian Compact's deep reconnaissance division following the [[Omicron Collapse|/lore/omicron-collapse]], one of only three operatives to survive prolonged exposure to void-matter without total cognitive dissolution. Her survival is attributed to an anomalous psionic resonance first detected during intake screening — a frequency that appears to partially cancel the entropic signature of void-born entities.",
        },
        {
          type: 'paragraph',
          text: 'Prior to recruitment, Vex served as a geological surveyor on the outer rim, mapping subsurface mineral deposits on low-gravity planetoids. This background gives her an unusual familiarity with confined subterranean environments — a skill set that has proven invaluable in navigating the spatially unstable interiors of void-contaminated structures.',
        },
        {
          type: 'paragraph',
          text: 'Field reports note that Vex experiences recurring episodes of "translucent vision" — brief intervals during which she perceives architectural geometry that does not correspond to physical reality. Medical evaluation classifies this as a benign side effect of void exposure. Vex herself describes it as "seeing the draft beneath the blueprint."',
        },
      ],
    },
  ],
  equipment: [
    { name: 'Spectral Caul', desc: 'Modified psi-shielding headpiece. Dampens Class III void emanations.' },
    { name: 'Ripper Blade', desc: 'Compact melee weapon. Vibro-edged, effective against calcified tissue.' },
    { name: 'Sonar Loom', desc: 'Subsurface mapping tool. Detects spatial anomalies within 50m radius.' },
    { name: 'Void Tincture (x3)', desc: 'Emergency stabilizer. Delays cognitive dissolution for approximately 4 hours.' },
  ],
  statBlocks: [
    {
      title: 'Operative Profile',
      stats: [
        { label: 'Rank', value: 'Class II', variant: 'accent' },
        { label: 'Status', value: 'ACTIVE', variant: 'accent' },
        { label: 'Strength', value: '14' },
        { label: 'Intelligence', value: '17' },
        { label: 'Faith', value: '6' },
        { label: 'Will', value: '19', variant: 'accent' },
        { label: 'Psi Rating', value: 'Latent III' },
        { label: 'Void Exposure', value: 'HIGH', variant: 'danger' },
      ],
    },
    {
      title: 'Service Record',
      stats: [
        { label: 'Missions', value: '34' },
        { label: 'KIA Avoided', value: '7', variant: 'danger' },
        { label: 'Cycle Joined', value: '4418' },
        { label: 'Clearance', value: 'Omega', variant: 'accent' },
      ],
    },
  ],
}
