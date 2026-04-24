import type { LoreData } from '../../types'

export const thresholdAccords: LoreData = {
  pageNumber: '075',
  header: {
    classification: 'Archive Fragment — Ratified Treaty',
    title: 'The Threshold Accords',
    subtitle: 'The legal architecture of humanity\'s response to the void',
    tags: ['archive', 'legal framework', 'political', 'sector 9 founding'],
  },
  sections: [
    {
      heading: 'Preface',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Threshold Accords are the foundational legal and military framework governing all human interaction with void-born phenomena. Ratified in Cycle 4418 by the Meridian Compact Directorate in closed emergency session, the Accords were drafted in direct response to the [[Omicron Collapse|/lore/omicron-collapse]] and represent the first formal acknowledgment by a governing body that extradimensional threats constitute a permanent and existential risk to human civilization.',
        },
      ],
    },
    {
      heading: 'Historical Context',
      blocks: [
        {
          type: 'paragraph',
          text: 'Prior to the Omicron Collapse, void-related phenomena were classified as theoretical hazards — acknowledged in academic literature but absent from military doctrine, emergency planning, or legal statute. The Collapse shattered this framework. Within 47 days, a functioning relay station was destroyed, eleven personnel were killed or dissolved, and an entity of unknown origin and capability was confirmed to exist inside sovereign Compact territory.',
        },
        {
          type: 'paragraph',
          text: "The political response was chaotic. The Directorate's initial instinct was suppression — the Collapse was classified at the highest level, and all surviving records were sealed. But suppression proved untenable. The [[Wasting Expanse|/map/wasting-expanse]] was expanding. Void-contamination readings were rising across the sector. And [[Operative Yael Mox|/character/yael-mox]], the sole survivor, was producing testimony that demanded institutional response.",
        },
        {
          type: 'quote',
          text: 'We cannot legislate the void out of existence. But we can legislate how we face it — with what authority, under what constraints, and with what accountability. The alternative is panic, and panic in the face of the incomprehensible is indistinguishable from surrender.',
          source: 'Director Sable, opening address to the Emergency Directorate, Cycle 4418',
        },
      ],
    },
    {
      heading: 'Key Provisions',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Accords established several foundational structures that continue to govern void-response operations:',
        },
        {
          type: 'paragraph',
          text: "Article 1 — Formation of Sector 9: A dedicated division within the Meridian Compact military apparatus, granted autonomous operational authority for all void-related reconnaissance, containment, and research. Sector 9 reports directly to the Directorate and is exempt from standard chain-of-command oversight. This exemption has been a source of ongoing political friction.",
        },
        {
          type: 'paragraph',
          text: "Article 3 — Classification Protocols: All void-related intelligence is classified at Omega level by default. Distribution is restricted to Sector 9 command staff and Directorate members with specific clearance. Unauthorized disclosure constitutes a capital offense under military tribunal jurisdiction. [[Operation Sable Threshold|/report/sable-threshold]]'s after-action report was filed under this protocol.",
        },
        {
          type: 'paragraph',
          text: 'Article 5 — Engagement Doctrine: Contact with void-born entities is governed by a tiered response framework. Class I–II entities may be engaged with standard ordnance under field commander discretion. Class III entities require Sector 9 authorization. Class IV and above — including the [[Pallid Watcher|/bestiary/pallid-watcher]] — are designated OBSERVE ONLY unless the Directorate issues a specific engagement order.',
        },
        {
          type: 'paragraph',
          text: "Article 7 — Survivor Protocols: Personnel who survive direct void exposure are subject to mandatory cognitive monitoring for a minimum of twelve cycles. Monitoring includes twice-daily psionic baseline scans, restricted movement, and periodic debrief under cognitive protocol. [[Operative Mox|/character/yael-mox]]'s ongoing confinement is authorized under this article.",
        },
        {
          type: 'paragraph',
          text: 'Article 9 — Research Ethics: The use of void-derived materials in equipment development requires oversight committee approval. This provision was added after controversy surrounding the development of the [[Spectral Caul|/item/spectral-caul]], whose psi-shielding frequency was calibrated using neural tissue from void-exposure casualties.',
        },
      ],
    },
    {
      heading: 'Ongoing Debate',
      blocks: [
        {
          type: 'paragraph',
          text: "The Accords are not universally supported within the Compact. A vocal minority in the Directorate argues that Sector 9's autonomous authority has created an unaccountable military apparatus operating beyond civilian oversight. Others contend that the OBSERVE ONLY doctrine for Class IV entities is a de facto policy of inaction that cedes territory to the void.",
        },
        {
          type: 'paragraph',
          text: 'The most contentious debate concerns Article 12 — the so-called \"Closing Provision\" — which authorizes the Directorate to approve \"permanent neutralization measures\" for void-contaminated zones if containment is deemed impossible. Critics argue this is a euphemism for the destruction of entire regions, including any surviving personnel or civilians within them. Proponents counter that the provision exists precisely because the alternative — allowing void contamination to spread unchecked — is worse.',
        },
        {
          type: 'quote',
          text: "The Accords are a cage we built around a problem we don't understand, using rules written by people who are afraid. That's not governance. That's ritual.",
          source: 'Cpt. Nira Solenne, dissenting testimony, Cycle 4420 review session',
        },
      ],
    },
  ],
}
