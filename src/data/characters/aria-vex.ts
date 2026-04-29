import type { ProfileTemplate } from '../../types'

export const ariaVex: ProfileTemplate = {
  kind: 'profile',
  pageNumber: '007',
  drift: 0.31,
  name: 'Aria Vex',
  employeeNumber: 'S9-2207',
  role: 'Field Operative · Class II',
  department: 'Sector 9 · Deep Reconnaissance',
  location: 'Sector 9 Forward Station · Bay 4',
  manager: {
    role: 'Captain · Sector 9 Operations',
    name: 'Nira Solenne',
    employeeNumber: 'S9-0118',
  },
  reports: [],
  serviceRecord: [
    { date: 'Cycle 4416', entry: 'Recruited — Geological Survey Division, outer-rim subsurface mapping.' },
    { date: 'Cycle 4418', entry: 'Transferred to Sector 9 (Deep Reconnaissance) under post-[[Omicron Collapse|/lore/omicron-collapse]] intake. Survived prolonged void-matter exposure during evaluation.' },
    { date: 'Cycle 4419', entry: 'First active deployment. Field-cleared for solo reconnaissance.' },
    { date: 'Cycle 4420', entry: 'Promoted to Class II. Issued [[Spectral Caul|/item/spectral-caul]].' },
    { date: 'Cycle 4422', entry: 'Clearance elevated to Omega per Article 3 of [[the Threshold Accords|/lore/threshold-accords]].' },
    { date: 'Cycle 4424', entry: '30 missions completed. KIA-avoided count: 7.' },
    { date: 'Cycle 4427', entry: 'Active duty. Most recent debrief filed Day 184.' },
  ],
  dossier: [
    {
      type: 'paragraph',
      text: 'Aria Vex was recruited into the Meridian Compact\'s deep reconnaissance division following the [[Omicron Collapse|/lore/omicron-collapse]], one of only three operatives to survive prolonged exposure to void-matter without total cognitive dissolution. Her survival is attributed to an anomalous psionic resonance first detected during intake screening — a frequency that appears to partially cancel the entropic signature of void-born entities.',
    },
    {
      type: 'paragraph',
      text: 'Prior to recruitment, Vex served as a geological surveyor on the outer rim, mapping subsurface mineral deposits on low-gravity planetoids. This background gives her an unusual familiarity with confined subterranean environments — a skill set that has proven invaluable in navigating the spatially unstable interiors of void-contaminated structures.',
    },
    {
      type: 'paragraph',
      text: 'Field reports note that Vex experiences recurring episodes of "translucent vision" — brief intervals during which she perceives architectural geometry that does not correspond to physical reality. Medical evaluation classifies this as a benign side effect of void exposure. Vex herself describes it as "seeing the draft beneath the blueprint."',
    },
    {
      type: 'table',
      caption: 'Standard Issue',
      columns: ['Item', 'Function'],
      rows: [
        ['[[Spectral Caul|/item/spectral-caul]]', 'Modified psi-shielding headpiece. Dampens Class III void emanations.'],
        ['Ripper Blade', 'Compact vibro-edged melee. Effective against calcified tissue.'],
        ['Sonar Loom', 'Subsurface mapping tool. 50m radius.'],
        ['Void Tincture × 3', 'Emergency stabilizer. ~4-hour cognitive grace period.'],
      ],
    },
  ],
  sections: [],
  footer: {
    media: ['text'],
    viewingHistory: [
      { who: 'N. Solenne', when: 'C4427 D192 · 09:14' },
      { who: 'A. Vex (subject access)', when: 'C4427 D188 · 14:30' },
      { who: 'archive.intranet', when: 'C4427 D050 · 02:00' },
    ],
  },
}
