import type { ArtifactTemplate } from '../../types'

export const greyfieldChoir: ArtifactTemplate = {
  kind: 'artifact',
  pageNumber: '016',
  drift: 0.51,
  header: {
    classification: 'Hostile Entity — Class II (Swarm)',
    title: 'The Greyfield Choir',
    subtitle: 'They move together. They sing together. They are not together.',
    tags: ['void-born', 'swarm-class', 'subsonic', 'recurring threat'],
  },
  image: {
    aspect: 'wide',
    placeholderLabel: '[ illustration: the greyfield choir, observed formation ]',
    caption: 'Fig. 16 — Composite sketch from three independent field reports, Glass Flats region (W1). Note synchronized posture across all figures.',
  },
  sections: [
    {
      heading: 'Field Report',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Greyfield Choir is a swarm-class void entity first catalogued during Cycle 4419 survey operations in the [[Wasting Expanse|/map/wasting-expanse]]. Unlike the singular apex presence of the [[Pallid Watcher|/bestiary/pallid-watcher]], the Choir manifests as a cluster of between seven and thirty-one humanoid figures that move in rigid synchronization — each body mirroring the others with zero measurable latency.',
        },
        {
          type: 'paragraph',
          text: 'The figures are uniformly grey, emaciated, and featureless. No facial structure, no digits, no distinguishing anatomy. They stand approximately 1.9 meters tall and emit a persistent subsonic harmonic measured at 14–18 Hz — below the threshold of conscious hearing but within the range known to cause anxiety, nausea, and visual disturbance in humans. Field teams operating near a Choir report a pervasive sense of grief without identifiable cause.',
        },
        {
          type: 'quote',
          text: 'They were standing in the flats, maybe forty meters out. Sixteen of them. Not moving. Then they all raised one hand at the same time — the same hand, the same angle, the same speed. Like puppets on the same string. Except there was no string. There was nothing connecting them at all.',
          source: 'Patrol Log 4419-K, Sgt. Calla Wren, Expanse Perimeter Watch',
        },
        {
          type: 'paragraph',
          text: "The Choir does not engage in active predation. Its threat model is environmental: prolonged exposure to the subsonic harmonic causes progressive cognitive degradation — disorientation within thirty minutes, paranoia within two hours, and a dissociative state the medical corps terms \"grey fugue\" after six hours. Three perimeter guards have been lost to grey fugue, walking calmly into the Expanse toward a Choir formation and failing to respond to recall signals.",
        },
        {
          type: 'paragraph',
          text: "Engagements have proven partially effective. Kinetic weapons disperse individual figures, which collapse into an ash-like particulate that sublimates within seconds. However, the swarm reconstitutes to full count within 4–8 hours, typically in a different location. [[Operation Glass Litany|/report/glass-litany]] was the first sustained attempt to study the Choir's reconstitution cycle.",
        },
      ],
    },
    {
      heading: 'Behavioral Notes',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Choir appears to be drawn to areas of prior human habitation. Formations have been observed near [[Outpost Kaya|/location/outpost-kaya]] (evacuated Cycle 4418), the Glass Flats relay tower (W1), and the eastern perimeter of the Expanse. Whether this represents territorial behavior, curiosity, or a form of mimicry is unknown.',
        },
        {
          type: 'quote',
          text: "They weren't threatening. That's what made them so hard to look at. They were just... standing where people used to stand. Doing nothing. Like they were waiting for instructions that were never going to come.",
          source: 'Operative Yael Mox, Cognitive Debrief 4420-F',
        },
      ],
    },
  ],
  statBlocks: [
    {
      title: 'Combat Profile',
      stats: [
        { label: 'Threat', value: 'MODERATE', variant: 'accent' },
        { label: 'Type', value: 'Swarm — Void' },
        { label: 'HP (each)', value: '~12' },
        { label: 'Armor', value: 'None' },
        { label: 'Speed', value: 'Slow' },
        { label: 'Range', value: '80m (harmonic)' },
        { label: 'Psionic', value: 'Class II' },
        { label: 'Weakness', value: 'Kinetic (temp.)', variant: 'accent' },
      ],
    },
    {
      title: 'Encounter Data',
      stats: [
        { label: 'First Seen', value: 'Cy. 4419' },
        { label: 'Sightings', value: '23' },
        { label: 'Max Count', value: '31' },
        { label: 'Status', value: 'RECURRING', variant: 'danger' },
      ],
    },
  ],
  footer: {
    media: ['text', 'image'],
    viewingHistory: [
      { who: 'Expanse Perimeter Watch', when: 'C4427 D195 · 06:30' },
      { who: 'C. Wren', when: 'C4427 D188 · 22:14' },
      { who: 'archive.bestiary', when: 'C4419 D203 · 04:00' },
    ],
  },
}
