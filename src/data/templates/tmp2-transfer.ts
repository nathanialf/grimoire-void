import type { ArtifactTemplate } from '../../types'

// TMP2 — Transfer Notice. A paper personnel document held in archive.
// Reuses the ArtifactTemplate (no separate "Transfer" type) — the
// recipient/issuer/effective metadata sits in a sidebar StatBlock; the
// body sections carry the change rationale. No image — it is a paper
// document, not an object with a visual.

export const tmp2Transfer: ArtifactTemplate = {
  kind: 'artifact',
  pageNumber: 'TMP2',
  drift: 0.0,
  header: {
    classification: 'Personnel · Routine',
    title: 'Notice of Internal Transfer — Template',
    subtitle: 'Paper personnel document · TR-XXXX-NNNN',
    tags: ['template', 'transfer', 'personnel'],
  },
  sections: [
    {
      heading: 'Purpose',
      blocks: [
        {
          type: 'paragraph',
          text: 'A transfer notice confirms that an employee has moved between departments, floors, or reporting lines. It is the record of record for the change. The recipient receives a copy on access; their prior and incoming managers are listed in the access log; the document is filed in the personnel record permanently.',
        },
      ],
    },
    {
      heading: 'Body',
      blocks: [
        {
          type: 'paragraph',
          text: 'Keep the body short. Two paragraphs is typical: one stating the change (what closes, what opens, when), and one stating the institution\'s expectation of the recipient (handover, onboarding, acknowledgment). Compensation and benefits language is omitted unless changing — by default they remain unchanged across a lateral transfer.',
        },
      ],
    },
  ],
  statBlocks: [
    {
      title: 'Transfer',
      stats: [
        { label: 'Document', value: '{TR-XXXX-NNNN}' },
        { label: 'Recipient', value: '{Name + ID}' },
        { label: 'Issuer', value: '{Office and floor}' },
        { label: 'Effective', value: '{Cycle / day}', variant: 'accent' },
      ],
    },
    {
      title: 'Reporting',
      stats: [
        { label: 'Outgoing Mgr', value: '{Prior manager}' },
        { label: 'Incoming Mgr', value: '{New manager}' },
        { label: 'Closes', value: '{Cycle / day}' },
        { label: 'Opens', value: '{Cycle / day}', variant: 'accent' },
      ],
    },
  ],
  footer: {
    media: ['text'],
    viewingHistory: [
      { who: '{Recipient access}', when: '{Cycle / day / time}' },
      { who: '{Incoming manager}', when: '{Cycle / day / time}' },
      { who: '{Outgoing manager}', when: '{Cycle / day / time}' },
      { who: 'archive.personnel', when: '{Cycle / day / time}' },
    ],
  },
}
