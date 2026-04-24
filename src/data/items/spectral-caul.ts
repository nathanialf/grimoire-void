import type { ItemData } from '../../types'

export const spectralCaul: ItemData = {
  pageNumber: '030',
  header: {
    classification: 'Standard Issue — Psi-Shielding',
    title: 'The Spectral Caul',
    subtitle: 'See clearly. Think clearly. Do not ask what it is made of.',
    tags: ['equipment', 'psi-shielding', 'sector 9 issue', 'class-iii rated'],
  },
  image: {
    aspect: 'square',
    placeholderLabel: '[ equipment diagram: spectral caul, exploded view ]',
    caption: 'Fig. 30 — Standard-issue Spectral Caul, Mark IV revision. Neural contact points highlighted.',
  },
  sections: [
    {
      heading: 'Equipment Analysis',
      blocks: [
        {
          type: 'paragraph',
          text: "The Spectral Caul is a psi-shielding headpiece issued to all Sector 9 deep reconnaissance operatives rated for Class III void exposure or above. It is the primary piece of protective equipment carried by [[Aria Vex|/character/aria-vex]] and was standard kit for all members of the [[Operation Sable Threshold|/report/sable-threshold]] fireteam. The device functions by generating a low-amplitude counter-resonance field around the wearer's cerebral cortex, dampening the entropic psionic frequencies emitted by void-born entities.",
        },
        {
          type: 'paragraph',
          text: "The Caul takes the form of a close-fitting mesh hood extending from the crown to the base of the skull, with twelve neural contact points that interface directly with the wearer's dermal layer. Activation is automatic upon contact. Operatives report a faint pressure behind the eyes during use — described variously as \"wearing a thought\" or \"a headache that belongs to someone else.\" Extended wear beyond 96 hours is not recommended due to risk of neural imprinting.",
        },
        {
          type: 'paragraph',
          text: 'Field performance is rated effective against Class II and Class III void emanations. Against Class IV entities such as the [[Pallid Watcher|/bestiary/pallid-watcher]], the Caul provides only partial mitigation — buying the wearer an estimated 8–15 additional minutes of cognitive coherence before dissolution onset. This margin proved insufficient during Operation Sable Threshold but remains the best available protection in the current Sector 9 arsenal.',
        },
      ],
    },
    {
      heading: 'Development History',
      blocks: [
        {
          type: 'paragraph',
          text: "The Spectral Caul was developed during Cycles 4418–4419 by Sector 9's Applied Psi-Defense Division, in direct response to the [[Omicron Collapse|/lore/omicron-collapse]]. Early prototypes were ineffective — the counter-resonance frequencies were derived from theoretical models that underestimated the complexity of void-born psionic signatures. The breakthrough came when researchers gained access to preserved neural tissue from void-exposed casualties recovered from [[The Sunken Relay|/location/sunken-relay]].",
        },
        {
          type: 'paragraph',
          text: 'The tissue — specifically, samples from the temporal and parietal lobes — exhibited a residual psionic pattern that, when mapped and inverted, produced a counter-frequency far more effective than any synthetic model. The Mark III and subsequent revisions of the Caul are calibrated to this biologically derived frequency. The ethical implications of this derivation process were debated within the [[Threshold Accords|/lore/threshold-accords]] framework and remain a point of contention among oversight committees.',
        },
        {
          type: 'quote',
          text: 'The dead taught us how to protect the living. Whether they consented to the lesson is a question we have collectively agreed not to answer.',
          source: 'Dr. Ren Kaspar, Applied Psi-Defense Division, internal memo Cycle 4419',
        },
        {
          type: 'paragraph',
          text: "Current Mark IV Cauls are manufactured at the Meridian Compact's secure fabrication facility on Station Vantage. Each unit requires approximately 40 hours of calibration and is keyed to its assigned operative's neural signature. The Caul cannot be shared between personnel without a full recalibration cycle. [[Operation Glass Litany|/report/glass-litany]] field teams were among the first to deploy the Mark IV revision in active void-contaminated terrain.",
        },
      ],
    },
  ],
  statBlocks: [
    {
      title: 'Equipment Profile',
      stats: [
        { label: 'Class', value: 'III Rated', variant: 'accent' },
        { label: 'Type', value: 'Psi-Shield' },
        { label: 'Protection', value: 'Class II–III' },
        { label: 'Weight', value: '0.4 kg' },
        { label: 'Duration', value: '96h max' },
        { label: 'Void Sig.', value: 'Low' },
        { label: 'Calibration', value: 'Per-operative' },
        { label: 'Origin', value: 'Bio-derived', variant: 'danger' },
      ],
    },
    {
      title: 'Issue Record',
      stats: [
        { label: 'Revision', value: 'Mark IV' },
        { label: 'First Issued', value: 'Cy. 4419' },
        { label: 'Units Active', value: '34' },
        { label: 'Clearance', value: 'Sigma', variant: 'accent' },
      ],
    },
  ],
}
