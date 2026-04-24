import type { ReportData } from '../../types'

export const sableThreshold: ReportData = {
  pageNumber: '085',
  header: {
    classification: 'After-Action Report — CLASSIFIED',
    title: 'Operation Sable Threshold',
    subtitle: 'Cycle 4417.3 — Relay Station Omicron-7 Recovery Theater',
  },
  sections: [
    {
      heading: 'Executive Summary',
      blocks: [
        {
          type: 'paragraph',
          text: 'On Cycle 4417.3, a six-operative fireteam designated SABLE was deployed to Relay Station Omicron-7 with orders to recover navigational archives and assess structural viability for reoccupation. The station had been offline since the [[Omicron Collapse|/lore/omicron-collapse]] of Cycle 4415 and was presumed derelict. This presumption proved catastrophically incorrect.',
        },
        {
          type: 'paragraph',
          text: 'Contact with an entity matching the profile of the [[Pallid Watcher|/bestiary/pallid-watcher]] — previously classified as a theoretical threat — was confirmed within the first ninety minutes of insertion. The fireteam sustained total mission failure. Of six operatives deployed, one survived extraction. No navigational data was recovered. The [[Hollow Blade|/item/hollow-blade]], a resonance-class artifact carried by operative [[Aria Vex|/character/aria-vex]] as a countermeasure, was lost within the station and remains unrecovered.',
        },
        {
          type: 'paragraph',
          text: 'This report recommends immediate reclassification of the Pallid Watcher from THEORETICAL to ACTIVE, permanent quarantine of Relay Station Omicron-7, and suspension of all recovery operations within the [[Wasting Expanse|/map/wasting-expanse]] until further notice.',
        },
      ],
    },
    {
      heading: 'Findings',
      blocks: [
        {
          type: 'paragraph',
          text: "Analysis of Mox's debrief, equipment telemetry, and the nine seconds of Hask's footage yields the following conclusions:",
        },
        {
          type: 'paragraph',
          text: "The [[Pallid Watcher|/bestiary/pallid-watcher]] is not a residual phenomenon of the [[Omicron Collapse|/lore/omicron-collapse]]. It is an occupying presence. The station's continued atmospheric and gravitational function — despite confirmed reactor failure — indicates the entity is actively maintaining the environment. The purpose of this maintenance is unknown, but the selective deletion of navigational data suggests territorial behavior or, more disturbingly, strategic intelligence.",
        },
        {
          type: 'paragraph',
          text: "The [[Hollow Blade|/item/hollow-blade]]'s failure is of particular concern. Pre-mission modeling indicated a 73% probability of successful resonance disruption against Phase-class entities. The Blade's oscillation inversion suggests the Watcher did not merely resist the weapon — it *adapted* to the resonance frequency in real time and turned it. This implies a capacity for learning that exceeds all prior threat models.",
        },
        {
          type: 'paragraph',
          text: "Mox's account of the pre-programmed extraction coordinates remains unexplained. If accurate, it suggests the Watcher was aware of the shuttle's systems and either *permitted* or *facilitated* Mox's escape. The implications of this are deeply troubling and require separate analysis under Code STILLWATER.",
        },
      ],
    },
  ],
  missionStats: {
    title: 'Operation Details',
    stats: [
      { label: 'Designation', value: 'SABLE THRESHOLD' },
      { label: 'Authorization', value: 'Sector 9 Cmd // Dir. Halcyon Mire' },
      { label: 'Cycle', value: '4417.3 — 4417.3.7' },
      { label: 'Theater', value: 'Relay Station Omicron-7, Wasting Expanse' },
      { label: 'Objective', value: 'Data recovery, structural assessment' },
      { label: 'Team Size', value: '6 operatives', variant: 'accent' },
      { label: 'Status', value: 'MISSION FAILURE', variant: 'danger' },
    ],
  },
  timeline: [
    {
      timestamp: '4417.3.0',
      event: 'Fireteam SABLE deploys from forward carrier *Ashen Circuit* via drop-shuttle. Comms nominal. Station appears dark on all bands — no electromagnetic signature, no thermal bloom. Consistent with derelict classification.',
    },
    {
      timestamp: '4417.3.1',
      event: 'Breach of outer hull via maintenance airlock C-14. Atmosphere inside registers breathable but anomalous — oxygen levels 4% above station baseline. Internal gravity still active despite reported reactor failure. Operative Yael Mox flags this discrepancy. Team lead [[Aria Vex|/character/aria-vex]] authorizes continued advance.',
    },
    {
      timestamp: '4417.3.2',
      event: 'Team reaches the primary data vault in Sector 3. Terminals are intact but wiped — not corrupted, not damaged, but *selectively emptied*. All navigational archives have been excised with surgical precision. Metadata logs indicate deletion occurred three cycles *after* the station went offline. Vex orders a full diagnostic sweep.',
    },
    {
      timestamp: '4417.3.3',
      event: 'Operative Dren Solari reports auditory anomalies in corridor J-7 — a low resonance hum below 20 Hz, consistent with Watcher proximity signatures documented in theoretical models. Vex deploys the [[Hollow Blade|/item/hollow-blade]] from its shielded case as a precautionary measure.',
    },
    {
      timestamp: '4417.3.4',
      event: 'First visual contact. Operative Fen Hask, on rear guard, transmits a nine-second feed before signal loss. Footage shows a tall, emaciated figure moving through a sealed bulkhead without opening it. The entity does not walk — it displaces. Hask\'s biotelemetry flatlines simultaneously.',
    },
    {
      timestamp: '4417.3.5',
      event: 'Full engagement. The Pallid Watcher manifests in the data vault. Vex attempts resonance counter with the [[Hollow Blade|/item/hollow-blade]] — initial readings suggest partial disruption of the entity\'s phase state. For eleven seconds, it becomes visible to standard optics. Then the Blade\'s oscillation inverts. Vex reports the weapon is "singing wrong" before her comms cut.',
    },
    {
      timestamp: '4417.3.6',
      event: 'Three operatives confirmed dead within a ninety-second window: Hask, Solari, and Operative Kael Brunt. Cause of death consistent across all three — instantaneous cellular dehydration with no external trauma. Operative Yael Mox and Operative Lira Dane initiate emergency extraction. Vex\'s transponder goes dark in Sector 3. The Hollow Blade\'s resonance signature vanishes from all instruments.',
    },
    {
      timestamp: '4417.3.7',
      event: 'Mox reaches airlock C-14. Dane does not. Mox reports hearing Dane\'s voice behind her, speaking calmly, saying words that "hadn\'t been invented yet." Mox seals the airlock without looking back. Extraction shuttle retrieves Mox at coordinates already programmed into the shuttle\'s nav — no one had entered them. Mox is the sole survivor.',
    },
  ],
  casualties: [
    { status: 'KIA', text: 'Operative Fen Hask — Rear guard. Cellular dehydration, instantaneous.' },
    { status: 'KIA', text: 'Operative Dren Solari — Scout. Cellular dehydration, instantaneous.' },
    { status: 'KIA', text: 'Operative Kael Brunt — Demolitions. Cellular dehydration, instantaneous.' },
    { status: 'MIA', text: 'Operative Lira Dane — Medic. Last contact corridor J-7. Status: PRESUMED LOST.' },
    { status: 'MIA', text: 'Team Lead Aria Vex — Resonance specialist. Last contact Sector 3 data vault. Status: PRESUMED LOST.' },
    { status: 'LOST', text: 'The Hollow Blade — Resonance-class artifact. Last signal Sector 3. Recovery priority: MAXIMUM.' },
  ],
  recommendations: [
    'Reclassify the Pallid Watcher from THEORETICAL to ACTIVE-HOSTILE. Update all field manuals, threat indices, and operative briefing materials immediately.',
    'Establish a permanent quarantine perimeter around Relay Station Omicron-7 at a minimum radius of 200 kilometers. Deploy automated warning buoys on all standard approach vectors.',
    'Suspend all Sector 9 operations within the Wasting Expanse pending comprehensive threat reassessment. No personnel are to enter the region without Director-level authorization.',
    'Commission a dedicated research cell under Code STILLWATER to analyze the Watcher\'s apparent strategic intelligence, its interaction with resonance weaponry, and the anomalous extraction coordinates.',
    'Initiate recovery planning for the Hollow Blade under separate operational authority. The artifact\'s loss represents an unacceptable gap in Sector 9\'s counter-entity capability. However, any recovery attempt must account for the possibility that the Blade has been compromised or repurposed.',
    'Debrief Operative Yael Mox under full cognitive protocol. Her account contains details that may indicate partial psychic exposure. Recommend monitoring for latent influence patterns consistent with Watcher contact.',
  ],
  classNotice: {
    header: '// CLEARANCE: OMEGA AND ABOVE //',
    body: [
      'This document is classified under Sector 9 Operational Directive 11-C. Unauthorized distribution constitutes a breach of the Threshold Accords and is punishable under military tribunal. All personnel who have accessed this report are hereby logged and subject to periodic cognitive screening for a minimum of twelve cycles.',
      'Portions of this report have been [[███REDACTED███|/redacted/067|danger]] pending review by the Directorate of Extradimensional Affairs. Full operational timeline available only under Code STILLWATER clearance.',
    ],
    footer: 'Filed by: Cmdr. Orin Duskfall, Sector 9 After-Action Division\nReviewed by: Dir. Halcyon Mire\nDistribution: EYES ONLY — Sector 9 Command Staff',
  },
}
