import type { LoreData } from '../../types'

export const omicronCollapse: LoreData = {
  pageNumber: '071',
  header: {
    classification: 'Archive Fragment — Recovered',
    title: 'The Omicron Collapse',
    subtitle: 'A reconstruction from partial records, Cycles 4415–4417',
    tags: ['archive', 'historical', 'partially redacted', 'void event'],
  },
  sections: [
    {
      heading: 'Preface',
      blocks: [
        {
          type: 'paragraph',
          text: 'The following account has been reconstructed from surviving data cores, field logs, and testimony fragments recovered during Cycles 4418–4420. Significant gaps remain. Passages marked with [REDACTED] indicate content lost to data corruption or classified above Omega clearance. The Meridian Compact Historical Division makes no guarantee of completeness or accuracy.',
        },
      ],
    },
    {
      heading: 'Timeline of Events',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Omicron Collapse refers to the cascading systems failure and spatial distortion event that consumed Relay Station Omicron-7 and the surrounding region of planetoid XR-881 over a period of approximately 47 standard days during Cycles 4416–4417. It remains the single most significant void incursion event in recorded human history.',
        },
        {
          type: 'quote',
          text: 'At 0347 local, the long-range antenna array registered a signal of unknown origin. The signal did not arrive from any catalogued direction. Technician Olu Maren described it as "coming from inside the receiver." Within six hours, 14 of 22 station personnel reported identical auditory hallucinations: a voice reading a sequence of numbers that, when transcribed, corresponded to the atomic weights of elements not found on any periodic table.',
          source: 'Incident Report 4416-001, Station Commander Elias Dren',
        },
        {
          type: 'paragraph',
          text: "Over the following three weeks, the station experienced progressive spatial instability. Corridors extended beyond their architectural boundaries. Internal navigation systems reported distances between compartments that exceeded the station's total physical volume. Two crew members — Specialists Rho and Tanaka — disappeared into a maintenance shaft that, according to all blueprints, should have terminated after twelve meters. Search teams measured the shaft at over three hundred meters before being recalled.",
        },
        {
          type: 'quote',
          text: "[REDACTED] ...the geometry was wrong. Not broken — wrong. Like looking at a word you've read a thousand times and suddenly it doesn't mean anything. The walls were still walls. The floor was still floor. But the space they enclosed had become something else. Something that was watching us understand it.",
          source: 'Field Log 4417-B, Operative Yael Mox',
        },
      ],
    },
    {
      heading: 'The Manifestation',
      blocks: [
        {
          type: 'paragraph',
          text: 'On day 31, the entity now classified as the [[Pallid Watcher|/bestiary/pallid-watcher]] was observed for the first time. It appeared in the reactor chamber — or rather, it was noticed there. Surviving accounts disagree on whether the entity arrived or was revealed, as though it had always been present but previously unperceived.',
        },
        {
          type: 'paragraph',
          text: 'Of the eleven personnel remaining at the time of manifestation, ten experienced immediate and total cognitive dissolution — a state described in clinical literature as "the erasure of the self\'s narrative coherence." The sole survivor, Operative Yael Mox, was recovered from the station\'s exterior hull 72 hours later by an automated retrieval drone. Her final field log, recorded during the event, remains the primary source document for Pallid Watcher behavioral analysis.',
        },
        {
          type: 'quote',
          text: 'It did not move toward us. We moved toward it. We had always been moving toward it. Every corridor we walked, every hatch we sealed, every breath — all of it was approach. There was never any other direction.',
          source: 'Field Log 4417-C, Operative Yael Mox (posthumous classification)',
        },
      ],
    },
    {
      heading: 'Aftermath',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Meridian Compact declared Relay Station Omicron-7 a total loss on day 47. The surrounding 400-kilometer zone — subsequently designated the [[Wasting Expanse|/map/wasting-expanse]] — was placed under permanent restricted access. Void-matter contamination levels in the region remain elevated and show no signs of decay, contradicting prevailing theoretical models that predict entropic dissipation over time.',
        },
        {
          type: 'paragraph',
          text: "The Omicron Collapse prompted the formation of Sector 9's deep reconnaissance division and the development of psi-shielding equipment rated for Class III void exposure. It also led to the reclassification of the [[Pallid Watcher|/bestiary/pallid-watcher]] from theoretical to confirmed, and the establishment of [[Protocol Sable|/report/sable-threshold]] — the contingency framework for future void incursion events of equivalent or greater magnitude.",
        },
        {
          type: 'quote',
          text: 'We did not discover the void. The void discovered us. The Omicron Collapse was not a catastrophe — it was an introduction.',
          source: 'Director Sable, Meridian Compact closed session, Cycle 4418',
        },
      ],
    },
  ],
}
