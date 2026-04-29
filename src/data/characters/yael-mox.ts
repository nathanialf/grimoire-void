import type { ProfileTemplate } from '../../types'

export const yaelMox: ProfileTemplate = {
  kind: 'profile',
  pageNumber: '010',
  drift: 0.58,
  name: 'Yael Mox',
  employeeNumber: 'S9-1809',
  role: 'Field Operative · Class III (Suspended)',
  department: 'Sector 9 · Cognitive Monitoring',
  location: 'Meridian Compact Medical Research · Restricted Wing · Cell 4',
  manager: {
    role: 'Director · Cognitive Monitoring Division',
    name: 'Lev Ashara',
    employeeNumber: 'CM-0042',
  },
  reports: [],
  serviceRecord: [
    { date: 'Cycle 4409', entry: 'Recruited — Sector 9 Deep Reconnaissance, Class I.' },
    { date: 'Cycle 4413', entry: 'Promoted to Class II. Commendation for spatial navigation under adverse conditions.' },
    { date: 'Cycle 4416', entry: 'Promoted to Class III. Fourteen deep-field missions logged without incident.' },
    { date: 'Cycle 4418', entry: 'Sole survivor of the [[Omicron Collapse|/lore/omicron-collapse]]. Recovered from Relay Station Omicron-7 hull, T+72h.' },
    { date: 'Cycle 4418', entry: 'Field status suspended. Cognitive monitoring initiated under Article 7 of [[the Threshold Accords|/lore/threshold-accords]].' },
    { date: 'Cycle 4419', entry: 'Field logs canonized as primary source for [[Operation Sable Threshold|/report/sable-threshold]] threat assessment.' },
    { date: 'Cycle 4421', entry: 'Cognitive dampener implanted. Efficacy uncertain.' },
    { date: 'Cycle 4422', entry: 'Clearance revoked. Personal effects removed to secure storage.' },
    { date: 'Cycle 4427', entry: 'Active monitoring. Twice-daily psionic baseline scans ongoing.' },
  ],
  dossier: [
    {
      type: 'paragraph',
      text: 'Operative Yael Mox is the sole confirmed survivor of the [[Omicron Collapse|/lore/omicron-collapse]] — the 47-day cascading void incursion that consumed Relay Station Omicron-7 and killed or dissolved the remaining ten personnel on-site. Mox was recovered from the station\'s exterior hull by an automated retrieval drone 72 hours after the final manifestation event, in a state of severe dehydration and repeating a sequence of numbers that did not correspond to any known mathematical system.',
    },
    {
      type: 'paragraph',
      text: 'Prior to the Collapse, Mox served as a Class III reconnaissance operative with commendations for spatial navigation under adverse conditions. She had logged fourteen deep-field missions without incident. Colleagues described her as methodical, quiet, and possessed of an unusually steady composure under pressure — traits that Sector 9 psychologists now believe may have contributed to her survival where others experienced total cognitive dissolution.',
    },
    {
      type: 'paragraph',
      text: 'Since recovery, Mox has been placed under permanent cognitive monitoring per [[the Threshold Accords|/lore/threshold-accords]], Article 7. She is housed in a restricted wing of the Meridian Compact\'s medical research facility and subjected to twice-daily psionic baseline scans. Her field status is officially suspended, though her testimony and surviving field logs remain the primary source documents for [[Pallid Watcher|/bestiary/pallid-watcher]] behavioral analysis.',
    },
    {
      type: 'quote',
      text: "I didn't escape. It let me leave. There's a difference, and the difference is the worst thing I know.",
      source: 'Cognitive Debrief 4418-R, Operative Yael Mox',
    },
    {
      type: 'paragraph',
      text: 'Mox\'s field logs from the Collapse — recorded on a personal device recovered with her — form the backbone of [[Operation Sable Threshold|/report/sable-threshold]]\'s threat assessment. Her descriptions of the Watcher\'s behavior remain unmatched in their detail and coherence, a fact that has itself become a source of concern: no other void-exposed individual has retained such clarity of recall. Medical staff note that Mox can describe the entity\'s movements with a precision that suggests ongoing perceptual contact, though all instruments register her psionic signature as baseline.',
    },
    {
      type: 'paragraph',
      text: 'Mox presents with persistent hypervigilance, flat affect, and what evaluators describe as "anticipatory stillness" — an unnerving tendency to orient toward doorways and corridors several seconds before anyone enters them. She does not sleep in a recognizable cycle but instead enters a semi-conscious state for periods of exactly 47 minutes, a duration that matches the length of the Omicron Collapse to the day.',
    },
    {
      type: 'paragraph',
      text: 'She has not requested reassignment. She has not requested discharge. When asked what she wants, she consistently answers: "To be useful before it stops letting me be." The referent of "it" has never been clarified.',
    },
    {
      type: 'quote',
      text: "She knows things she shouldn't. Not classified information — that would be a manageable security problem. She knows things that haven't happened yet. And she's usually right.",
      source: 'Dr. Lev Ashara, Cognitive Monitoring Division, Cycle 4421',
    },
    {
      type: 'table',
      caption: 'Standard Issue (Confiscated · Restricted)',
      columns: ['Item', 'Status'],
      rows: [
        ['Field gear (full kit)', 'Confiscated. Personal effects in secure storage.'],
        ['Recorder Unit (modified)', 'Permitted under supervision. Voice-activated; therapeutic journaling only.'],
        ['Cognitive Dampener', 'Subcutaneous implant, base of skull. Efficacy: uncertain.'],
      ],
    },
  ],
  sections: [],
  footer: {
    media: ['text'],
    viewingHistory: [
      { who: 'L. Ashara', when: 'C4427 D196 · 18:42' },
      { who: 'N. Solenne', when: 'C4427 D188 · 11:02' },
      { who: 'archive.intranet', when: 'C4426 D050 · 02:00' },
    ],
  },
}
