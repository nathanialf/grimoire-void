import type { ReportData } from '../../types'

export const glassLitany: ReportData = {
  pageNumber: '090',
  header: {
    classification: 'After-Action Report — CLASSIFIED',
    title: 'Operation Glass Litany',
    subtitle: 'Cycle 4422.1 — Glass Flats Reconnaissance Theater (W1)',
  },
  sections: [
    {
      heading: 'Executive Summary',
      blocks: [
        {
          type: 'paragraph',
          text: 'On Cycle 4422.1, a four-operative fireteam designated LITANY was deployed to the Glass Flats region (grid reference W1) of the [[Wasting Expanse|/map/wasting-expanse]] with orders to observe and document [[Greyfield Choir|/bestiary/greyfield-choir]] activity, assess the viability of sustained field operations in the region, and test the Mark IV [[Spectral Caul|/item/spectral-caul]] under active void-contamination conditions.',
        },
        {
          type: 'paragraph',
          text: "The operation is classified as a partial success. Primary observation objectives were met: the team recorded 14 hours of continuous Choir behavioral data, including the first documented reconstitution event. Caul performance exceeded projections, with all four operatives maintaining cognitive baseline throughout the observation phase. However, the mission's extraction phase was compromised by an unanticipated Choir response, resulting in one operative KIA and one critically injured.",
        },
        {
          type: 'paragraph',
          text: 'This report recommends continued observation operations in the Glass Flats sector with revised extraction protocols and increased team size. The Greyfield Choir, while less individually threatening than the [[Pallid Watcher|/bestiary/pallid-watcher]], represents a persistent and adaptable hazard whose behavioral patterns require further study.',
        },
      ],
    },
    {
      heading: 'Findings',
      blocks: [
        {
          type: 'paragraph',
          text: "The [[Greyfield Choir|/bestiary/greyfield-choir]] operates on a cyclical pattern. The formation observed at W1 consisted of nineteen figures maintaining a static position for approximately 6 hours before simultaneously collapsing into particulate matter. Reconstitution occurred 4.7 hours later at a position 800 meters northwest of the original formation. The reconstituted Choir contained the same number of figures — nineteen — suggesting the swarm's count is fixed rather than variable.",
        },
        {
          type: 'paragraph',
          text: 'The subsonic harmonic emitted by the Choir was measured at 16.3 Hz — consistent with prior readings but notably stable across the full observation period. Previous reports described the frequency as variable; this stability may indicate the Choir was in a resting or passive state during observation. The Mark IV [[Spectral Caul|/item/spectral-caul]] effectively dampened the harmonic, with operatives reporting only mild unease rather than the progressive cognitive degradation documented in unshielded encounters.',
        },
        {
          type: 'paragraph',
          text: 'The critical finding: the Choir responded to the team\'s extraction movement. When the fireteam initiated withdrawal at hour 14, all nineteen figures rotated simultaneously to face the team — the first recorded instance of directed Choir attention toward a specific target. The subsonic frequency shifted from 16.3 Hz to 11.7 Hz, a range associated with acute panic response in humans. Operative Marsh, positioned at the rear, removed his Caul due to a calibration fault and was exposed to the shifted frequency for approximately ninety seconds.',
        },
      ],
    },
  ],
  missionStats: {
    title: 'Operation Details',
    stats: [
      { label: 'Designation', value: 'GLASS LITANY' },
      { label: 'Authorization', value: 'Sector 9 Cmd // Lt. Cmdr. Ossa Dray' },
      { label: 'Cycle', value: '4422.1 — 4422.1.3' },
      { label: 'Theater', value: 'Glass Flats (W1), Wasting Expanse' },
      { label: 'Objective', value: 'Choir observation, Caul field test' },
      { label: 'Team Size', value: '4 operatives', variant: 'accent' },
      { label: 'Status', value: 'PARTIAL SUCCESS', variant: 'accent' },
    ],
  },
  timeline: [
    {
      timestamp: '4422.1.0',
      event: 'Fireteam LITANY deploys from [[Outpost Kaya|/location/outpost-kaya]] staging area via ground transport. Approach vector avoids known Choir positions. All operatives equipped with Mark IV Spectral Cauls. Comms nominal.',
    },
    {
      timestamp: '4422.1.1',
      event: 'Team establishes observation post at grid W1-7, approximately 200 meters from a nineteen-figure Choir formation. Subsonic harmonic detected at 16.3 Hz. Cauls active and performing within parameters. No Choir response to team presence. Observation phase begins.',
    },
    {
      timestamp: '4422.1.1.6',
      event: 'Choir formation collapses. All nineteen figures simultaneously lose structural cohesion, disintegrating into grey particulate over a 3-second interval. Particulate sublimates within 40 seconds. Ground temperature at the formation site drops 8°C. Team maintains position and continues recording.',
    },
    {
      timestamp: '4422.1.2',
      event: 'Reconstitution event observed at 800 meters northwest. Nineteen figures emerge from ground-level particulate condensation over a 12-second interval. Figures assume identical positions to pre-collapse formation. Subsonic harmonic resumes at 16.3 Hz. This is the first documented Choir reconstitution.',
    },
    {
      timestamp: '4422.1.2.8',
      event: "Team leader Operative Jace Corr initiates extraction protocol. Team begins withdrawal toward transport. All nineteen Choir figures rotate to face the team simultaneously. Harmonic frequency drops from 16.3 Hz to 11.7 Hz. Operative Renn Marsh's Caul reports calibration fault — neural contact point 7 intermittent.",
    },
    {
      timestamp: '4422.1.3',
      event: "Marsh removes Caul to inspect the fault. Exposed to 11.7 Hz harmonic for approximately ninety seconds before Operative Desta Kael replaces the Caul on Marsh's head. During exposure, Marsh ceases withdrawal and turns toward the Choir. Kael physically restrains and redirects Marsh. Marsh is unresponsive for eleven minutes. Choir does not advance but maintains orientation toward the team throughout extraction.",
    },
    {
      timestamp: '4422.1.3.2',
      event: "During final approach to transport, Operative Lin Daro — rear guard — reports a second Choir formation materializing between the team and the vehicle. Seven figures, previously undetected. Daro attempts to bypass. Contact with the second formation's harmonic at close range (<20m) causes immediate grey fugue despite active Caul. Daro walks into the formation. Corr and Kael extract Marsh to transport. Daro's transponder signal ceases 4 minutes after contact.",
    },
  ],
  casualties: [
    { status: 'KIA', text: 'Operative Lin Daro — Rear guard. Grey fugue, close-range harmonic exposure. Body not recovered.' },
    { status: 'MIA', text: 'Operative Renn Marsh — Observer. Recovered alive. Severe cognitive impairment, ongoing treatment. Prognosis: uncertain.' },
  ],
  recommendations: [
    'Continue Glass Flats observation operations. The Greyfield Choir represents a tractable research target and the behavioral data gathered during LITANY is invaluable. However, all future missions must deploy with a minimum team size of six and redundant Caul units.',
    'Investigate the Choir\'s directed-attention response during extraction. The simultaneous reorientation of all figures suggests a collective awareness or triggering mechanism that activates upon target withdrawal. This may indicate the Choir functions as a territorial deterrent rather than an active predator.',
    'Revise Mark IV Spectral Caul maintenance protocols. The calibration fault experienced by Operative Marsh occurred at hour 13 of continuous use — within the rated 96-hour window but near the upper boundary of field-tested durations. Recommend mandatory Caul diagnostic at 8-hour intervals during active operations.',
    'Commission recovery operation for Operative Daro\'s remains and equipment. The close-range harmonic exposure data from Daro\'s Caul telemetry — if recoverable — would significantly advance understanding of grey fugue onset mechanics.',
    'Reassess Outpost Kaya as a forward staging area. The outpost\'s proximity to Choir patrol routes presents both risk and opportunity. The unauthorized occupants detected during Cycle 4422 surveys may possess intelligence relevant to Choir behavioral patterns.',
  ],
  classNotice: {
    header: '// CLEARANCE: SIGMA AND ABOVE //',
    body: [
      'This document is classified under Sector 9 Operational Directive 14-A. Unauthorized distribution constitutes a breach of the Threshold Accords and is subject to tribunal review. All personnel who have accessed this report are logged and subject to standard cognitive screening protocols.',
      'Choir harmonic frequency data contained in this report is restricted to the Applied Psi-Defense Division. Unauthorized reproduction of frequency measurements may constitute a cognitohazard.',
    ],
    footer: 'Filed by: Lt. Cmdr. Ossa Dray, Sector 9 Field Operations\nReviewed by: Dir. Halcyon Mire\nDistribution: SIGMA CLEARANCE — Sector 9 Command and Research Staff',
  },
}
