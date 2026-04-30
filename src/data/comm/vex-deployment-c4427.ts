import type { CommTemplate } from '../../types'

// Ambient placeholder communication — in the wiki and nav but absent from
// MUSEUM_PEDESTALS, so it has no cartridge. A direct message from Captain
// Solenne to Aria Vex (her direct report; see profile/aria-vex). Stand-in
// body until real correspondence content lands.

export const vexDeploymentC4427: CommTemplate = {
  kind: 'comm',
  pageNumber: '011',
  drift: 0.18,
  slug: 'vex-deployment-c4427',
  filename: 'solenne-vex-c4427-d188.cmm',
  filetype: 'COMMUNICATION',
  author: 'N. Solenne',
  sharedWith: ['A. Vex'],
  meta: [
    { label: 'Subject', value: 'D192 perimeter sweep — kit + brief' },
    { label: 'Sent', value: 'C4427 D188 · 06:45' },
  ],
  variant: 'group',
  title: 'Deployment Notice [Vex]',
  subject: 'D192 perimeter sweep — kit + brief',
  from: 'N. Solenne · S9-0118',
  to: ['A. Vex · S9-2207'],
  sent: 'C4427 D188 · 06:45',
  body: [
    {
      type: 'paragraph',
      text: 'Vex — D192, 04:00 muster, Bay 4. Sweep arc north of [[Outpost Kaya|/location/outpost-kaya]] to the eastern perimeter shelf. Kit per Class II protocol; bring the [[Spectral Caul|/artifact/spectral-caul]] and a full set of Void Tinctures. Sonar Loom is mandatory for this run — the shelf has been settling.',
    },
    {
      type: 'paragraph',
      text: 'Brief at 03:30 in the situation room. Two analysts will be present from Cognitive Monitoring. Their interest in this sweep is pre-cleared; do not engage them on the standing inquiry into your psionic baseline. If they raise it, the answer is *no comment, on advice of medical*.',
    },
    {
      type: 'paragraph',
      text: 'Confirm receipt and kit-readiness by D187 EOD. If anything in your most recent scans changes the deployment posture, route through me before Records sees it.',
    },
    {
      type: 'paragraph',
      text: '— Solenne',
    },
  ],
  footer: {
    viewingHistory: [
      { who: 'A. Vex', when: 'C4427 D187 · 19:08' },
      { who: 'N. Solenne (sent)', when: 'C4427 D188 · 06:45' },
      { who: 'archive.audit', when: 'C4427 D188 · 06:45' },
    ],
  },
}
