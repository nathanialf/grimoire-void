import type { CommTemplate } from '../../types'

// Attached ambient for the test cartridge. Surfaces in the wiki only
// once test-cartridge has been canonised complete (per isDocVisible's
// attachedTo branch in src/data/index.ts). Used to exercise the
// "completion unlocks additional ambient lore document" rule.

export const testCartridgeNotes: CommTemplate = {
  kind: 'comm',
  pageNumber: '007',
  drift: 0.07,
  slug: 'test-cartridge-notes',
  filename: 'custody-notes-test-cartridge.cmm',
  filetype: 'COMMUNICATION',
  author: 'Archive Custody',
  sharedWith: ['Sector 9 — All Hands'],
  meta: [
    { label: 'Subject', value: 'Notes · test cartridge canonisation' },
    { label: 'Sent', value: 'C4427 D201 · 09:12' },
  ],
  variant: 'group',
  title: 'Custody Note · Test Cartridge',
  subject: 'Notes · test cartridge canonisation',
  from: 'Archive Custody',
  to: ['Sector 9 — All Hands'],
  sent: 'C4427 D201 · 09:12',
  body: [
    {
      type: 'paragraph',
      text: 'Logged for the file: the test cartridge has been canonised in full. Three pegs returned, three fragments seated, one entry on the floor.',
    },
    {
      type: 'paragraph',
      text: 'Operators interested in extending the fixture may file requests through Custody. The pegs in Ironwood Tideline remain in place across sessions; a fresh cart, dispensed on shift start, may scan them and dock again. The pedestal does not.',
    },
  ],
  footer: {
    viewingHistory: [
      { who: 'Archive Custody', when: 'C4427 D201 · 09:12' },
    ],
  },
}
