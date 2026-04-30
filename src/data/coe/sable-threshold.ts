import type { COETemplate } from '../../types'

export const sableThreshold: COETemplate = {
  kind: 'coe',
  pageNumber: '085',
  drift: 0.69,
  slug: 'sable-threshold',
  filename: 'op-sable-4417.coe',
  filetype: 'COE',
  author: 'Incident Review Board',
  sharedWith: ['Sector 9 — All Hands', 'Incident Review Board', "Director's Office"],
  meta: [
    { label: 'Severity', value: 'SEV-1' },
    { label: 'Status', value: 'CLOSED · Pallid Watcher reclassified ACTIVE-HOSTILE' },
  ],
  incidentId: 'OP-SABLE-4417',
  title: 'Operation Sable Threshold',
  service: 'Sector 9 · Deep Reconnaissance',
  status: 'CLOSED · Pallid Watcher reclassified ACTIVE-HOSTILE',
  severity: 'SEV-1',
  detected: 'Cycle 4417.3.4 (first visual contact, T+90m post-insertion)',
  mitigated: 'Cycle 4417.3.7 (sole survivor extracted)',
  resolved: 'Cycle 4417.3.7',
  filed: 'Cycle 4417 · Day 210 · 18:30 standard',
  authors: ['Cmdr. Orin Duskfall (Sector 9 After-Action Division)'],
  reviewers: ['Dir. Halcyon Mire (Sector 9 Command)'],

  issueSummary: [
    {
      type: 'paragraph',
      text: 'On Cycle 4417.3, a six-operative fireteam designated SABLE was deployed to Relay Station Omicron-7 with orders to recover navigational archives and assess structural viability for reoccupation. The station had been offline since the [[Omicron Collapse|/lore/omicron-collapse]] of Cycle 4415 and was presumed derelict. This presumption proved catastrophically incorrect.',
    },
    {
      type: 'paragraph',
      text: 'Contact with an entity matching the profile of the [[Pallid Watcher|/bestiary/pallid-watcher]] — previously classified as a theoretical threat — was confirmed within the first ninety minutes of insertion. The fireteam sustained total mission failure. Of six operatives deployed, one survived extraction. No navigational data was recovered. The [[Hollow Blade|/artifact/hollow-blade]], a resonance-class artifact carried as a countermeasure, was lost within the station and remains unrecovered.',
    },
    {
      type: 'paragraph',
      text: 'This is a SEV-1 because the operation suffered total customer-facing failure (5 of 6 operatives lost), a Class V restricted artifact was lost in hostile territory, and the underlying threat profile was substantially understated by pre-mission intelligence. The Pallid Watcher\'s adaptive capacity exceeds all prior threat models.',
    },
  ],

  customerImpact: [
    {
      type: 'paragraph',
      text: 'Personnel: 3 KIA (Hask, Solari, Brunt — instantaneous cellular dehydration); 2 MIA (Dane, Vex — presumed lost). Sole survivor: Operative [[Yael Mox|/personnel/yael-mox]], extracted at airlock C-14 under unexplained nav-coordinate guidance. Mox is now under permanent cognitive monitoring per Article 7 of [[the Threshold Accords|/lore/threshold-accords]].',
    },
    {
      type: 'paragraph',
      text: 'Material: [[The Hollow Blade|/artifact/hollow-blade]] — resonance-class artifact, Class V restricted — last signal Sector 3 data vault. Recovery priority: MAXIMUM. The artifact may be compromised, repurposed, or actively in use by the Watcher.',
    },
    {
      type: 'paragraph',
      text: 'Strategic: All navigational archives at Omicron-7 were found pre-deleted (selective excision, no corruption signature). Sector 9 retains no usable cartographic data for the Wasting Expanse interior. Recovery of the data was the operation\'s primary objective.',
    },
  ],

  incidentResponseAnalysis: {
    ttd: {
      value: '0h 90m',
      rationale: 'First visual contact occurred 90 minutes after insertion. Detection timing was within tolerance for a presumed-derelict environment, though pre-mission intelligence failed to identify the active occupation.',
      improvement: 'Future deployments to formerly-occupied void-event sites must assume occupation rather than dereliction. Update pre-mission threat baselines accordingly.',
    },
    tte: {
      value: '0h 11m',
      rationale: 'Team Lead Vex deployed the Hollow Blade from its shielded case within 11 minutes of audio anomaly detection. Engagement protocol was followed correctly under field conditions.',
      improvement: 'None. TTE was within tolerance and consistent with current resonance-engagement doctrine.',
    },
    ttr: {
      value: 'N/A — total mission failure',
      rationale: 'Resolution was not possible. The Hollow Blade\'s oscillation inverted within 11 seconds of engagement. Three operatives died within a 90-second window thereafter. The entity adapted to the resonance frequency in real time and turned it against the fireteam.',
      improvement: 'Pre-mission resonance-modeling assumed Phase-class entity behavior. Threat models must account for adaptive resonance inversion in Class IV+ entities. See Action Items 04 and 05.',
    },
  },

  timeline: [
    {
      timestamp: '4417.3.0',
      event: 'Fireteam SABLE deploys from forward carrier *Ashen Circuit* via drop-shuttle. Comms nominal. Station appears dark on all bands — no electromagnetic signature, no thermal bloom. Consistent with derelict classification.',
    },
    {
      timestamp: '4417.3.1',
      event: 'Breach of outer hull via maintenance airlock C-14. Atmosphere inside registers breathable but anomalous — oxygen levels 4% above station baseline. Internal gravity still active despite reported reactor failure. Operative [[Yael Mox|/personnel/yael-mox]] flags this discrepancy. Team lead [[Aria Vex|/personnel/aria-vex]] authorizes continued advance.',
    },
    {
      timestamp: '4417.3.2',
      event: 'Team reaches the primary data vault in Sector 3. Terminals are intact but wiped — not corrupted, not damaged, but *selectively emptied*. All navigational archives have been excised with surgical precision. Metadata logs indicate deletion occurred three cycles *after* the station went offline. Vex orders a full diagnostic sweep.',
    },
    {
      timestamp: '4417.3.3',
      event: 'Operative Dren Solari reports auditory anomalies in corridor J-7 — a low resonance hum below 20 Hz, consistent with Watcher proximity signatures documented in theoretical models. Vex deploys [[the Hollow Blade|/artifact/hollow-blade]] from its shielded case as a precautionary measure.',
    },
    {
      timestamp: '4417.3.4',
      event: 'First visual contact. Operative Fen Hask, on rear guard, transmits a nine-second feed before signal loss. Footage shows a tall, emaciated figure moving through a sealed bulkhead without opening it. The entity does not walk — it displaces. Hask\'s biotelemetry flatlines simultaneously.',
    },
    {
      timestamp: '4417.3.5',
      event: 'Full engagement. The Pallid Watcher manifests in the data vault. Vex attempts resonance counter with [[the Hollow Blade|/artifact/hollow-blade]] — initial readings suggest partial disruption of the entity\'s phase state. For eleven seconds, it becomes visible to standard optics. Then the Blade\'s oscillation inverts. Vex reports the weapon is "singing wrong" before her comms cut.',
    },
    {
      timestamp: '4417.3.6',
      event: 'Three operatives confirmed dead within a ninety-second window: Hask, Solari, and Operative Kael Brunt. Cause of death consistent across all three — instantaneous cellular dehydration with no external trauma. Mox and Operative Lira Dane initiate emergency extraction. Vex\'s transponder goes dark in Sector 3. The Hollow Blade\'s resonance signature vanishes from all instruments.',
    },
    {
      timestamp: '4417.3.7',
      event: 'Mox reaches airlock C-14. Dane does not. Mox reports hearing Dane\'s voice behind her, speaking calmly, saying words that "hadn\'t been invented yet." Mox seals the airlock without looking back. Extraction shuttle retrieves Mox at coordinates already programmed into the shuttle\'s nav — no one had entered them. Mox is the sole survivor.',
    },
  ],

  fiveWhys: [
    'Why did the operation fail? Because the Pallid Watcher actively occupied Omicron-7 and the team\'s primary countermeasure — the Hollow Blade — was inverted by the entity in real time.',
    'Why was the Hollow Blade inverted? Because pre-mission resonance modeling assumed Phase-class entity behavior; the Watcher demonstrated adaptive capacity that altered the Blade\'s oscillation frequency mid-engagement.',
    'Why was the Watcher\'s adaptive capacity not anticipated? Because pre-mission threat modeling treated the Watcher as a residual phenomenon of the Omicron Collapse rather than an occupying intelligence.',
    'Why was the Watcher classified as residual? Because no further engagement had occurred since the Collapse, and the institution defaulted to the lowest-risk theoretical model in the absence of new data.',
    'Why was deployment authorized given the unknown threat profile? Because the data recovery objective was deemed strategically necessary and the prior orbital survey indicated derelict status. The institution accepted ambiguity it should have escalated.',
  ],

  lessonsLearned: [
    {
      type: 'paragraph',
      text: 'The selective deletion of navigational data — surgical, post-Collapse, coherent — indicates territorial behavior or, more disturbingly, strategic intelligence. The Watcher is not a residual phenomenon. It is an occupying presence that maintains environmental conditions and curates information. All future intelligence work in the Wasting Expanse must operate from this assumption.',
    },
    {
      type: 'paragraph',
      text: 'Resonance-class countermeasures cannot be assumed effective against Class IV+ entities. The Hollow Blade\'s real-time inversion implies a learning capacity that exceeds any prior threat model. Pre-mission resonance modeling must include adversarial-adaptation scenarios for any deployment to a known void-active site.',
    },
    {
      type: 'paragraph',
      text: 'Mox\'s account of pre-programmed extraction coordinates remains unexplained. If accurate, the Watcher was aware of the shuttle\'s nav systems and either *permitted* or *facilitated* her escape. The implications are deeply troubling and require separate analysis under Code STILLWATER. The institution does not know what was preserved by allowing Mox to leave.',
    },
  ],

  actionItems: [
    {
      description: 'Reclassify the [[Pallid Watcher|/bestiary/pallid-watcher]] from THEORETICAL to ACTIVE-HOSTILE. Update all field manuals, threat indices, and operative briefing materials immediately.',
      owner: 'Dir. H. Mire',
      priority: 'P0',
      dueDate: 'C4417 D215',
      status: 'Done',
    },
    {
      description: 'Establish a permanent quarantine perimeter around Relay Station Omicron-7 at minimum 200km radius. Deploy automated warning buoys on all standard approach vectors.',
      owner: 'Sector 9 Cmd',
      priority: 'P0',
      dueDate: 'C4417 D230',
      status: 'In Progress',
    },
    {
      description: 'Suspend all Sector 9 operations within [[the Wasting Expanse|/map/wasting-expanse]] pending comprehensive threat reassessment. No personnel are to enter the region without Director-level authorization.',
      owner: 'Dir. H. Mire',
      priority: 'P0',
      dueDate: 'C4417 D211',
      status: 'Done',
    },
    {
      description: 'Commission a dedicated research cell under Code STILLWATER to analyze the Watcher\'s strategic intelligence, resonance-adaptation behavior, and the anomalous extraction coordinates.',
      owner: 'Dir. Sable',
      priority: 'P1',
      dueDate: 'C4418 D060',
      status: 'In Progress',
    },
    {
      description: 'Initiate recovery planning for [[the Hollow Blade|/artifact/hollow-blade]] under separate operational authority. Account for the possibility that the artifact has been compromised or repurposed.',
      owner: 'Sector 9 Cmd',
      priority: 'P1',
      dueDate: 'C4418 D120',
      status: 'Not Started',
    },
    {
      description: 'Debrief [[Operative Yael Mox|/personnel/yael-mox]] under full cognitive protocol. Monitor for latent influence patterns consistent with Watcher contact. Cognitive monitoring authorized under Article 7 of [[the Threshold Accords|/lore/threshold-accords]].',
      owner: 'L. Ashara · Cognitive Monitoring',
      priority: 'P2',
      dueDate: 'Ongoing',
      status: 'In Progress',
    },
  ],

  relatedItems: [
    { id: 'OP-OMICRON-4416', title: 'The Omicron Collapse — precursor incident', path: '/lore/omicron-collapse' },
    { id: 'A-013', title: 'Pallid Watcher — entity record', path: '/bestiary/pallid-watcher' },
    { id: 'A-024', title: 'The Hollow Blade — lost in operation', path: '/artifact/hollow-blade' },
    { id: 'OP-LITANY-4422', title: 'Operation Glass Litany — successor study', path: '/coe/glass-litany' },
  ],

  footer: {
    viewingHistory: [
      { who: 'Dir. H. Mire', when: 'C4427 D188 · 09:00' },
      { who: 'Cmdr. O. Duskfall', when: 'C4417 D210 · 18:30' },
      { who: 'archive.audit', when: 'C4417 D210 · 18:30' },
    ],
  },
}
