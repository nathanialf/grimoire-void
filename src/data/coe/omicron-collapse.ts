import type { COETemplate } from '../../types'

// The Omicron Collapse — the founding incident. Filed retroactively as a
// SEV-1 retrospective during the establishment of Sector 9. The document
// is itself a reconstruction from partial records; the institution does
// not claim completeness.

export const omicronCollapse: COETemplate = {
  kind: 'coe',
  pageNumber: '071',
  drift: 0.81,
  slug: 'omicron-collapse',
  filename: 'coe-c4418-omicron-collapse.coe',
  filetype: 'COE',
  author: 'Incident Review Board',
  sharedWith: ['Sector 9 — All Hands', 'Incident Review Board', "Director's Office"],
  meta: [
    { label: 'Severity', value: 'SEV-1' },
    { label: 'Status', value: 'CLOSED · ratified Threshold Accords as institutional response' },
  ],
  incidentId: 'OP-OMICRON-4416',
  title: 'The Omicron Collapse',
  service: 'Meridian Compact · pre-Sector-9 era',
  status: 'CLOSED · ratified Threshold Accords as institutional response',
  severity: 'SEV-1',
  detected: 'Cycle 4416 · Day 0347 (anomalous signal received at antenna array)',
  mitigated: 'Cycle 4417 · Day 47 (station declared total loss; survivor extracted)',
  resolved: 'Cycle 4418 (Threshold Accords ratified; permanent quarantine established)',
  filed: 'Cycle 4418 · Day 305 · post-ratification retrospective',
  authors: ['Meridian Compact Historical Division', 'Director Sable (Sector 9, founding)'],
  reviewers: ['Meridian Compact Directorate (closed session)'],

  issueSummary: [
    {
      type: 'paragraph',
      text: 'The Omicron Collapse refers to the cascading systems failure and spatial-distortion event that consumed Relay Station Omicron-7 and the surrounding region of planetoid XR-881 over approximately 47 standard days during Cycles 4416–4417. It remains the single most significant void incursion event in recorded human history.',
    },
    {
      type: 'paragraph',
      text: 'This retrospective has been reconstructed from surviving data cores, field logs, and testimony fragments recovered during Cycles 4418–4420. Significant gaps remain. Passages marked [REDACTED] indicate content lost to data corruption or classified above Omega clearance. The institution makes no guarantee of completeness or accuracy.',
    },
    {
      type: 'paragraph',
      text: 'SEV-1: total loss of a strategic relay station, 21 of 22 personnel killed or dissolved, first confirmed manifestation of a Class IV void-born entity ([[the Pallid Watcher|/bestiary/pallid-watcher]]), and creation of a permanent void-contaminated zone ([[the Wasting Expanse|/map/wasting-expanse]]) that has not decayed contrary to all theoretical models.',
    },
  ],

  customerImpact: [
    {
      type: 'paragraph',
      text: 'Personnel: 21 killed or dissolved. The 22nd ([[Operative Yael Mox|/personnel/yael-mox]]) survived under unexplained circumstances and remains under permanent cognitive monitoring per Article 7 of [[the Threshold Accords|/lore/threshold-accords]].',
    },
    {
      type: 'paragraph',
      text: 'Material: Relay Station Omicron-7 — total loss. Long-range antenna array compromised. All navigational archives selectively excised post-Collapse (deletion timestamp three cycles after the station went offline; performer unknown).',
    },
    {
      type: 'paragraph',
      text: 'Strategic: The 400km surrounding region was placed under permanent restricted access as [[the Wasting Expanse|/map/wasting-expanse]]. Void-contamination levels in the region remain elevated and show no signs of decay, contradicting prevailing theoretical models that predict entropic dissipation over time. The contamination is permanent.',
    },
    {
      type: 'paragraph',
      text: 'Doctrinal: The Collapse forced the creation of Sector 9, the ratification of [[the Threshold Accords|/lore/threshold-accords]], and the reclassification of the Pallid Watcher from theoretical to confirmed. The institution\'s pre-Collapse threat model was demonstrated to be inadequate at every level.',
    },
  ],

  incidentResponseAnalysis: {
    ttd: {
      value: '6h (anomalous signal → first auditory hallucinations)',
      rationale: 'The station\'s antenna array logged the anomalous signal at 0347. Within six hours, 14 of 22 personnel reported identical auditory hallucinations. Detection of *something wrong* was rapid; detection of the actual nature of the incident was not possible — pre-Collapse threat models did not include this scenario.',
      improvement: 'Post-Collapse: continuous sub-20Hz subsonic monitoring established at all forward stations. Anomalous-signal protocols revised. See Action Item 03.',
    },
    tte: {
      value: '~21 days (signal → first formal report to Directorate)',
      rationale: 'Station Commander Dren\'s incident report was filed 21 days into the spatial-distortion phase, when corridors were extending beyond architectural boundaries and personnel were disappearing. Engagement was severely delayed by the institutional refusal to credit the anomalous data.',
      improvement: 'Article 3 of the Threshold Accords removes commanders\' discretion to delay reporting on void-related anomalies; all such reports route directly to Sector 9 within 24 hours of detection.',
    },
    ttr: {
      value: 'N/A — no recovery achieved',
      rationale: 'Resolution was not possible. The Pallid Watcher manifested on day 31. Of the 11 personnel remaining at manifestation, 10 experienced immediate total cognitive dissolution. The station was declared a total loss on day 47. The contamination has not decayed; it is the institution\'s working assumption that it never will.',
      improvement: 'OBSERVE ONLY doctrine codified in Article 5. The institution accepts that some void-active sites cannot be recovered and must be permanently quarantined.',
    },
  },

  timeline: [
    {
      timestamp: 'C4416 D0347 · 03:47',
      event: 'Long-range antenna array registers a signal of unknown origin. The signal does not arrive from any catalogued direction. Technician Olu Maren describes it as "coming from inside the receiver."',
    },
    {
      timestamp: 'C4416 D0347 · 09:47',
      event: '14 of 22 station personnel report identical auditory hallucinations: a voice reading a sequence of numbers that, when transcribed, correspond to the atomic weights of elements not found on any periodic table.',
    },
    {
      timestamp: 'C4416 · Day 14',
      event: 'Progressive spatial instability begins. Corridors extend beyond their architectural boundaries. Internal navigation systems report distances between compartments that exceed the station\'s total physical volume.',
    },
    {
      timestamp: 'C4416 · Day 18',
      event: 'Specialists Rho and Tanaka disappear into a maintenance shaft that should terminate after 12 meters. Search teams measure the shaft at over 300 meters before being recalled.',
    },
    {
      timestamp: 'C4416 · Day 21',
      event: 'Station Commander Dren files Incident Report 4416-001 with the Directorate. The report is initially classified at the highest level and not acted upon.',
    },
    {
      timestamp: 'C4417 · Day 31',
      event: '**Manifestation.** The entity later classified as [[the Pallid Watcher|/bestiary/pallid-watcher]] is observed for the first time in the reactor chamber. Surviving accounts disagree on whether the entity arrived or was revealed; multiple witnesses describe it as having "always been present but previously unperceived."',
    },
    {
      timestamp: 'C4417 · Day 31',
      event: 'Of the 11 personnel remaining at manifestation, 10 experience immediate and total cognitive dissolution. [[Operative Yael Mox|/personnel/yael-mox]] is the sole survivor and is later recovered from the station\'s exterior hull by automated drone, T+72h post-manifestation.',
    },
    {
      timestamp: 'C4417 · Day 47',
      event: 'Meridian Compact declares Relay Station Omicron-7 a total loss. The surrounding 400km zone is designated [[the Wasting Expanse|/map/wasting-expanse]] and placed under permanent restricted access.',
    },
    {
      timestamp: 'C4418 · Day 305',
      event: '[[The Threshold Accords|/lore/threshold-accords]] ratified by the Directorate in closed emergency session. Sector 9 established. Director Sable assumes founding command.',
    },
  ],

  fiveWhys: [
    'Why was Relay Station Omicron-7 lost? Because the station was occupied by a Class IV void-born entity ([[the Pallid Watcher|/bestiary/pallid-watcher]]) and 21 of 22 personnel experienced cognitive dissolution at manifestation.',
    'Why was the entity not detected and engaged earlier? Because pre-Collapse threat models did not include void-born intelligence; the institution treated void phenomena as theoretical hazards rather than as active threats.',
    'Why were void phenomena classified as theoretical? Because the institution had no prior confirmed contact and defaulted to academic-literature framing — phenomena that "could exist" were treated as phenomena that "do not exist."',
    'Why was Station Commander Dren\'s 21-day incident report not acted upon? Because the Directorate\'s standing classification protocols routed all anomalous reports to suppression rather than to investigation. Suppression was the default response to incomprehensible information.',
    'Why was suppression the default? Because the Compact\'s political institutions had no framework for handling extradimensional threats. The absence of doctrine produced the absence of response. The Threshold Accords were the corrective.',
  ],

  lessonsLearned: [
    {
      type: 'paragraph',
      text: 'Some incidents cannot be recovered. The institution accepts that the Wasting Expanse will not decay, that Relay Station Omicron-7 will not be reoccupied, and that 21 personnel are not coming back. Acknowledgment of permanence is itself a corrective action.',
    },
    {
      type: 'paragraph',
      text: 'Suppression is not a response. The Directorate\'s 21-day delay between Dren\'s report and Sector 9 escalation was itself a load-bearing contribution to the loss. Article 3 of the Threshold Accords codifies that anomalous reports must escalate within 24 hours of detection. Suppression as institutional habit is the failure mode the Accords were written to prevent.',
    },
    {
      type: 'paragraph',
      text: 'The institution does not understand what was preserved by allowing [[Operative Mox|/personnel/yael-mox]] to leave. Her survival is the central anomaly of the Collapse. All future engagements must account for the possibility that the Watcher is not solely hostile — that its behavior includes a component of *selection*.',
    },
    {
      type: 'paragraph',
      text: 'Pre-Collapse academic literature on void phenomena was extensive and largely correct. The failure was not in the science but in the institutional refusal to credit the science. Doctrine must follow data; in the Compact, prior to the Collapse, doctrine had been allowed to follow comfort.',
    },
  ],

  actionItems: [
    {
      description: 'Ratify [[the Threshold Accords|/lore/threshold-accords]] as the foundational legal and military framework for void-response operations.',
      owner: 'Meridian Compact Directorate',
      priority: 'P0',
      dueDate: 'C4418 D305',
      status: 'Done',
    },
    {
      description: 'Establish Sector 9 as a dedicated void-response division with autonomous operational authority. Director Sable, founding command.',
      owner: 'Meridian Compact Directorate',
      priority: 'P0',
      dueDate: 'C4418 D305',
      status: 'Done',
    },
    {
      description: 'Reclassify [[the Pallid Watcher|/bestiary/pallid-watcher]] from theoretical to confirmed. Update all field manuals and threat indices.',
      owner: 'Sector 9 Threat Index',
      priority: 'P0',
      dueDate: 'C4418 D310',
      status: 'Done',
    },
    {
      description: 'Establish permanent quarantine perimeter around [[the Wasting Expanse|/map/wasting-expanse]]. Deploy automated warning buoys.',
      owner: 'Sector 9 Cmd',
      priority: 'P0',
      dueDate: 'C4418 D330',
      status: 'Done',
    },
    {
      description: 'Develop psi-shielding equipment rated for Class III void exposure. See [[the Spectral Caul|/artifact/spectral-caul]] development history.',
      owner: 'Applied Psi-Defense',
      priority: 'P1',
      dueDate: 'C4419 D210',
      status: 'Done',
    },
    {
      description: 'Maintain permanent cognitive monitoring of [[Operative Yael Mox|/personnel/yael-mox]] under Article 7. Twice-daily psionic baseline scans. Indefinite duration.',
      owner: 'Cognitive Monitoring · L. Ashara',
      priority: 'P1',
      dueDate: 'Ongoing',
      status: 'In Progress',
    },
  ],

  relatedItems: [
    { id: 'TR-ACCORDS-4418', title: 'The Threshold Accords — institutional response', path: '/lore/threshold-accords' },
    { id: 'OP-SABLE-4417', title: 'Operation Sable Threshold — failed return to Omicron-7', path: '/coe/sable-threshold' },
    { id: 'A-013', title: 'Pallid Watcher — entity record', path: '/bestiary/pallid-watcher' },
    { id: 'A-058', title: 'The Wasting Expanse — permanent quarantine zone', path: '/map/wasting-expanse' },
    { id: 'CHAR-MOX', title: 'Yael Mox — sole survivor', path: '/personnel/yael-mox' },
  ],

  footer: {
    viewingHistory: [
      { who: 'Dir. H. Mire', when: 'C4427 D192 · 11:00' },
      { who: 'Dir. Sable (founding)', when: 'C4418 D310 · 14:00' },
      { who: 'archive.audit', when: 'C4418 D310 · 14:00' },
    ],
  },
}
