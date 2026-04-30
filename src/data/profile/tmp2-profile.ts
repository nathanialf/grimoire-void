import type { ProfileTemplate } from '../../types'

// TMP2 — Employee Profile schema reference. Demonstrates the profile
// chrome (intranet phonebook style) and lists what goes in each field.

export const tmp2Profile: ProfileTemplate = {
  kind: 'profile',
  pageNumber: 'TMP2',
  drift: 0.0,
  slug: 'tmp2-profile',
  filename: 'tmp2-profile.profile',
  filetype: 'PROFILE',
  author: 'Records Division',
  sharedWith: ['Sector 9 — Personnel', 'Records'],
  meta: [
    { label: 'Department', value: '{Department · floor}' },
    { label: 'Site', value: '{Sublevel / building / desk reference}' },
  ],
  name: '{Employee Name}',
  employeeNumber: '{A-NNNNN}',
  role: '{Role title}',
  department: '{Department · floor}',
  location: '{Sublevel / building / desk reference}',
  manager: {
    role: '{Manager role title}',
    name: '{Manager name}',
    employeeNumber: '{A-NNNNN}',
  },
  reports: [
    { role: '{Direct report role}', name: '{Name}', employeeNumber: '{A-NNNNN}' },
    { role: '{Direct report role}', name: '{Name}', employeeNumber: '{A-NNNNN}' },
  ],
  serviceRecord: [
    { date: '{Cycle XXXX}', entry: '{Joined institution as {role}.}' },
    { date: '{Cycle XXXX}', entry: '{Promoted / transferred / certified — describe the change.}' },
    { date: '{Cycle XXXX}', entry: '{Notable assignment, award, or sabbatical.}' },
    { date: '{Cycle XXXX}', entry: '{Most recent role or current placement.}' },
  ],
  dossier: [
    {
      type: 'paragraph',
      text: '{Free-form biographical narrative. The dossier is the load-bearing prose for this profile and is the section other documents (transfer notices, COEs, HR records) will cite when they need a portable description of the subject. Keep it factual, tonal, and readable as a standalone paragraph.}',
    },
    {
      type: 'paragraph',
      text: '{Use additional paragraphs for specialty, tenure, training, languages, clearance, or whatever the subject\'s record actually contains. Use `*italic*` for emphasis, `[[display|/path]]` for cross-references, and keep the tone aligned with the rest of the institution\'s personnel writing.}',
    },
  ],
  sections: [],
  footer: {
    viewingHistory: [
      { who: '{Latest viewer}', when: '{Cycle / day / time}' },
      { who: '{Manager (last access)}', when: '{Cycle / day / time}' },
      { who: 'archive.intranet', when: '{Cycle / day / time}' },
    ],
  },
}
