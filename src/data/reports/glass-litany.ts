import type { COETemplate } from '../../types'

export const glassLitany: COETemplate = {
  kind: 'coe',
  pageNumber: '090',
  drift: 0.55,
  incidentId: 'OP-LITANY-4422',
  title: 'Operation Glass Litany — Greyfield Choir Observation, Partial Success',
  service: 'Sector 9 · Field Operations',
  status: 'CLOSED · Glass Flats observation continues with revised protocols',
  severity: 'SEV-2',
  detected: 'Cycle 4422.1.2.8 (Choir directed-attention response observed)',
  mitigated: 'Cycle 4422.1.3.2 (extraction complete, 1 KIA / 1 MIA)',
  resolved: 'Cycle 4422.1.3.2',
  filed: 'Cycle 4422 · Day 305 · 21:00 standard',
  authors: ['Lt. Cmdr. Ossa Dray (Sector 9 Field Operations)'],
  reviewers: ['Dir. Halcyon Mire (Sector 9 Command)'],

  issueSummary: [
    {
      type: 'paragraph',
      text: 'On Cycle 4422.1, a four-operative fireteam designated LITANY was deployed to the Glass Flats region (W1) of [[the Wasting Expanse|/map/wasting-expanse]] to observe and document [[Greyfield Choir|/bestiary/greyfield-choir]] activity, assess sustained-operations viability, and field-test the Mark IV [[Spectral Caul|/item/spectral-caul]] under active void-contamination conditions.',
    },
    {
      type: 'paragraph',
      text: 'Primary observation objectives were met. The team recorded 14 hours of continuous Choir behavioral data, including the first documented reconstitution event. Caul performance exceeded projections. However, the extraction phase was compromised by an unanticipated Choir directed-attention response, resulting in 1 KIA and 1 critically injured. SEV-2: significant personnel impact, but mission objectives substantially achieved and threat profile clarified.',
    },
  ],

  customerImpact: [
    {
      type: 'paragraph',
      text: 'Personnel: 1 KIA — Operative Lin Daro (rear guard, grey fugue from close-range harmonic exposure, body not recovered). 1 MIA — Operative Renn Marsh (recovered alive, severe cognitive impairment, ongoing treatment, prognosis uncertain).',
    },
    {
      type: 'paragraph',
      text: 'Material: One Mark IV [[Spectral Caul|/item/spectral-caul]] unit lost with Operative Daro. Telemetry from Daro\'s Caul during close-range harmonic exposure would significantly advance grey-fugue onset analysis if recoverable.',
    },
    {
      type: 'paragraph',
      text: 'Strategic: Glass Flats observation operations remain viable with revised protocols. The Choir is now understood to operate on cyclical reconstitution patterns and to exhibit directed-attention response upon target withdrawal.',
    },
  ],

  incidentResponseAnalysis: {
    ttd: {
      value: '0h 0m',
      rationale: 'The Choir directed-attention response was detected in real time at extraction initiation. Subsonic frequency shift (16.3 Hz → 11.7 Hz) was observed instantly via Caul telemetry.',
      improvement: 'None. TTD was within tolerance.',
    },
    tte: {
      value: '0h 11m (Marsh) / 0h 4m (Daro)',
      rationale: 'Marsh\'s eleven-minute cognitive recovery delay was caused by a Caul calibration fault (neural contact point 7 intermittent) at hour 13. Operative Kael replaced the Caul within ninety seconds of removal but full coherence was not restored for eleven minutes. Daro\'s exposure occurred at close range (<20m) to a previously undetected second formation; engagement was unavoidable given the team\'s extraction vector.',
      improvement: 'Mandatory Caul diagnostic at 8-hour intervals during active operations. Pre-extraction perimeter sweep using long-range subsonic detection. See Action Items 02 and 03.',
    },
    ttr: {
      value: '0h 24m',
      rationale: 'Total extraction window from directed-attention onset to transport departure. Daro lost during final approach; Corr and Kael successfully extracted Marsh.',
      improvement: 'Larger team size (minimum 6) provides redundancy for similar future operations. See Action Item 01.',
    },
  },

  timeline: [
    {
      timestamp: '4422.1.0',
      event: 'Fireteam LITANY deploys from [[Outpost Kaya|/location/outpost-kaya]] staging area via ground transport. Approach vector avoids known Choir positions. All operatives equipped with Mark IV Spectral Cauls. Comms nominal.',
    },
    {
      timestamp: '4422.1.1',
      event: 'Team establishes observation post at grid W1-7, approximately 200m from a 19-figure Choir formation. Subsonic harmonic detected at 16.3 Hz. Cauls active and within parameters. Observation phase begins.',
    },
    {
      timestamp: '4422.1.1.6',
      event: 'Choir formation collapses. All 19 figures simultaneously lose structural cohesion, disintegrating into grey particulate over 3 seconds. Particulate sublimates within 40 seconds. Ground temperature drops 8°C at the formation site. Team maintains position.',
    },
    {
      timestamp: '4422.1.2',
      event: 'Reconstitution event observed at 800m northwest. 19 figures emerge from ground-level particulate condensation over 12 seconds. Figures assume identical positions to pre-collapse formation. Subsonic harmonic resumes at 16.3 Hz. **First documented Choir reconstitution.**',
    },
    {
      timestamp: '4422.1.2.8',
      event: 'Team leader Operative Jace Corr initiates extraction. **All 19 Choir figures rotate to face the team simultaneously.** Harmonic frequency drops from 16.3 Hz to 11.7 Hz. Operative Renn Marsh\'s Caul reports calibration fault — neural contact point 7 intermittent.',
    },
    {
      timestamp: '4422.1.3',
      event: 'Marsh removes Caul to inspect the fault. Exposed to 11.7 Hz harmonic for ~90 seconds before Operative Desta Kael replaces the Caul. During exposure, Marsh ceases withdrawal and turns toward the Choir. Kael physically restrains and redirects Marsh. Marsh unresponsive for 11 minutes. Choir maintains orientation but does not advance.',
    },
    {
      timestamp: '4422.1.3.2',
      event: 'During final approach to transport, Operative Lin Daro — rear guard — reports a second Choir formation materializing between the team and the vehicle. **7 figures, previously undetected.** Daro attempts to bypass. Contact at <20m causes immediate grey fugue despite active Caul. Daro walks into the formation. Corr and Kael extract Marsh to transport. Daro\'s transponder ceases 4m after contact.',
    },
  ],

  fiveWhys: [
    'Why was Operative Daro lost? Because a second Choir formation materialized between the team and transport at close range, and the Caul provided insufficient protection at <20m harmonic exposure.',
    'Why was the second formation undetected? Because pre-extraction perimeter sweep was not part of standard observation protocol; the team relied on initial-approach reconnaissance only.',
    'Why was Marsh\'s Caul calibration fault not caught earlier? Because Caul diagnostics are scheduled at mission start and end, not at intervals during sustained operation. Hour 13 is within the rated 96h window but at the upper boundary of field-tested durations.',
    'Why did the Choir respond to extraction with directed attention? Because the team\'s withdrawal triggered a previously-unobserved territorial-deterrent behavior. The Choir is not solely a passive presence; it has an awareness-and-response mode.',
    'Why was this awareness-and-response mode not predicted? Because all prior Choir encounters had been brief or asymmetric (the entity was approached, not departed-from). Glass Litany was the first sustained observation followed by orderly withdrawal.',
  ],

  lessonsLearned: [
    {
      type: 'paragraph',
      text: 'The Greyfield Choir exhibits cyclical reconstitution at approximately 4.7-hour intervals with fixed figure-counts (the formation observed maintained its 19-figure count after collapse and reconstitution). This stability suggests the swarm is a single distributed entity, not a population of individuals.',
    },
    {
      type: 'paragraph',
      text: 'The Choir\'s directed-attention response may indicate a territorial-deterrent function rather than active predation. The harmonic shift from 16.3 Hz to 11.7 Hz on extraction is the first documented frequency change in response to a target. Future protocols should treat extraction as a higher-risk phase than observation.',
    },
    {
      type: 'paragraph',
      text: 'The Mark IV [[Spectral Caul|/item/spectral-caul]] is effective at standard observation distances but does not protect against close-range (<20m) exposure to shifted harmonics. Caul ratings should be revised to specify both distance and harmonic-frequency operating envelopes.',
    },
  ],

  actionItems: [
    {
      description: 'Continue Glass Flats observation operations with minimum team size of 6 and redundant Caul units. The Choir is a tractable research target.',
      owner: 'Lt. Cmdr. O. Dray',
      priority: 'P0',
      dueDate: 'C4423 D060',
      status: 'In Progress',
    },
    {
      description: 'Revise Mark IV [[Spectral Caul|/item/spectral-caul]] maintenance protocols. Mandatory Caul diagnostic at 8-hour intervals during active operations.',
      owner: 'Applied Psi-Defense',
      priority: 'P0',
      dueDate: 'C4423 D015',
      status: 'Done',
    },
    {
      description: 'Add pre-extraction long-range subsonic perimeter sweep to standard Choir-observation protocol.',
      owner: 'Lt. Cmdr. O. Dray',
      priority: 'P1',
      dueDate: 'C4423 D030',
      status: 'In Progress',
    },
    {
      description: 'Investigate the Choir\'s directed-attention response. Determine whether it is a triggered territorial behavior or an emergent collective awareness.',
      owner: 'Code STILLWATER',
      priority: 'P1',
      dueDate: 'C4423 D120',
      status: 'In Progress',
    },
    {
      description: 'Commission recovery operation for Operative Daro\'s remains and Caul telemetry. Close-range harmonic exposure data would advance grey-fugue understanding.',
      owner: 'Sector 9 Cmd',
      priority: 'P2',
      dueDate: 'C4423 D090',
      status: 'Not Started',
    },
    {
      description: 'Reassess [[Outpost Kaya|/location/outpost-kaya]] as a forward staging area. The unauthorized occupants may possess intelligence relevant to Choir behavioral patterns.',
      owner: 'Sector 9 Intel',
      priority: 'P3',
      dueDate: 'C4423 D180',
      status: 'Not Started',
    },
  ],

  relatedItems: [
    { id: 'OP-SABLE-4417', title: 'Operation Sable Threshold — predecessor SEV-1', path: '/report/sable-threshold' },
    { id: 'A-016', title: 'Greyfield Choir — entity record', path: '/bestiary/greyfield-choir' },
    { id: 'A-030', title: 'Spectral Caul — countermeasure', path: '/item/spectral-caul' },
    { id: 'A-048', title: 'Outpost Kaya — staging area', path: '/location/outpost-kaya' },
  ],

  footer: {
    media: ['text'],
    viewingHistory: [
      { who: 'Dir. H. Mire', when: 'C4427 D196 · 11:30' },
      { who: 'Lt. Cmdr. O. Dray', when: 'C4422 D305 · 21:00' },
      { who: 'archive.audit', when: 'C4422 D305 · 21:00' },
    ],
  },
}
