import type { CharacterData } from '../../types'

export const yaelMox: CharacterData = {
  pageNumber: '010',
  header: {
    classification: 'Operative — Class III (Suspended)',
    title: 'Yael Mox',
    subtitle: 'Sole survivor of the Omicron Collapse. Permanent cognitive monitoring.',
    tags: ['operative', 'void-exposed', 'cognitively monitored', 'suspended duty'],
  },
  image: {
    aspect: 'tall',
    placeholderLabel: '[ operative portrait: yael mox, medical observation wing ]',
    caption: 'Fig. 10 — Operative Mox, Cycle 4420 cognitive evaluation. Note pupil dilation asymmetry and subdermal void-trace patterning.',
  },
  sections: [
    {
      heading: 'Personnel Dossier',
      blocks: [
        {
          type: 'paragraph',
          text: "Operative Yael Mox is the sole confirmed survivor of the [[Omicron Collapse|/lore/omicron-collapse]] — the 47-day cascading void incursion that consumed Relay Station Omicron-7 and killed or dissolved the remaining ten personnel on-site. Mox was recovered from the station's exterior hull by an automated retrieval drone 72 hours after the final manifestation event, in a state of severe dehydration and repeating a sequence of numbers that did not correspond to any known mathematical system.",
        },
        {
          type: 'paragraph',
          text: "Prior to the Collapse, Mox served as a Class III reconnaissance operative with commendations for spatial navigation under adverse conditions. She had logged fourteen deep-field missions without incident. Colleagues described her as methodical, quiet, and possessed of an unusually steady composure under pressure — traits that Sector 9 psychologists now believe may have contributed to her survival where others experienced total cognitive dissolution.",
        },
        {
          type: 'paragraph',
          text: "Since recovery, Mox has been placed under permanent cognitive monitoring per the [[Threshold Accords|/lore/threshold-accords]], Article 7. She is housed in a restricted wing of the Meridian Compact's medical research facility and subjected to twice-daily psionic baseline scans. Her field status is officially suspended, though her testimony and surviving field logs remain the primary source documents for [[Pallid Watcher|/bestiary/pallid-watcher]] behavioral analysis.",
        },
        {
          type: 'quote',
          text: "I didn't escape. It let me leave. There's a difference, and the difference is the worst thing I know.",
          source: 'Cognitive Debrief 4418-R, Operative Yael Mox',
        },
        {
          type: 'paragraph',
          text: "Mox's field logs from the Collapse — recorded on a personal device recovered with her — form the backbone of [[Operation Sable Threshold|/report/sable-threshold]]'s threat assessment. Her descriptions of the Watcher's behavior remain unmatched in their detail and coherence, a fact that has itself become a source of concern: no other void-exposed individual has retained such clarity of recall. Medical staff note that Mox can describe the entity's movements with a precision that suggests ongoing perceptual contact, though all instruments register her psionic signature as baseline.",
        },
      ],
    },
    {
      heading: 'Psychological Profile',
      blocks: [
        {
          type: 'paragraph',
          text: "Mox presents with persistent hypervigilance, flat affect, and what evaluators describe as \"anticipatory stillness\" — an unnerving tendency to orient toward doorways and corridors several seconds before anyone enters them. She does not sleep in a recognizable cycle but instead enters a semi-conscious state for periods of exactly 47 minutes, a duration that matches the length of the Omicron Collapse to the day.",
        },
        {
          type: 'paragraph',
          text: "She has not requested reassignment. She has not requested discharge. When asked what she wants, she consistently answers: \"To be useful before it stops letting me be.\" The referent of \"it\" has never been clarified.",
        },
        {
          type: 'quote',
          text: "She knows things she shouldn't. Not classified information — that would be a manageable security problem. She knows things that haven't happened yet. And she's usually right.",
          source: 'Dr. Lev Ashara, Cognitive Monitoring Division, Cycle 4421',
        },
      ],
    },
  ],
  equipment: [
    { name: 'None (Confiscated)', desc: 'All standard-issue gear removed upon return to monitoring. Personal effects in secure storage.' },
    { name: 'Recorder Unit (Modified)', desc: 'Voice-activated field log device. Permitted for therapeutic journaling under supervision.' },
    { name: 'Cognitive Dampener', desc: 'Subcutaneous implant, base of skull. Suppresses anomalous psionic output. Efficacy: uncertain.' },
  ],
  statBlocks: [
    {
      title: 'Operative Profile',
      stats: [
        { label: 'Rank', value: 'Class III', variant: 'accent' },
        { label: 'Status', value: 'SUSPENDED', variant: 'danger' },
        { label: 'Strength', value: '11' },
        { label: 'Intelligence', value: '16' },
        { label: 'Faith', value: '3' },
        { label: 'Will', value: '22', variant: 'danger' },
        { label: 'Psi Rating', value: 'Anomalous' },
        { label: 'Void Exposure', value: 'CRITICAL', variant: 'danger' },
      ],
    },
    {
      title: 'Service Record',
      stats: [
        { label: 'Missions', value: '15' },
        { label: 'KIA Avoided', value: '1', variant: 'danger' },
        { label: 'Cycle Joined', value: '4409' },
        { label: 'Clearance', value: 'Revoked', variant: 'danger' },
      ],
    },
  ],
}
