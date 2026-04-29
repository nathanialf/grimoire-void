import type { ArtifactTemplate } from '../../types'

// TMP4 — Artifact / Accession Record. Sections locked to match the
// existing wiki artifact structure (see hollow-blade.ts, spectral-caul.ts).

export const tmp4Artifact: ArtifactTemplate = {
  kind: 'artifact',
  pageNumber: 'TMP4',
  drift: 0.0,
  header: {
    classification: '{Artifact classification — e.g. "Artifact — Void-Touched"}',
    title: '{Artifact name}',
    subtitle: '{One-line subtitle — flavor or essential descriptor}',
    tags: ['{tag-1}', '{tag-2}', '{tag-3}'],
  },
  image: {
    aspect: 'wide',
    placeholderLabel: '{Terminal-aesthetic image · figure caption convention applies}',
    caption: '{Fig. NN — short factual caption identifying what the image shows.}',
  },
  sections: [
    {
      heading: 'Analysis',
      blocks: [
        {
          type: 'paragraph',
          text: '{What the artifact is — physical or functional description, salient properties, sensory details. Two to four short paragraphs is typical.}',
        },
        {
          type: 'paragraph',
          text: '{Continue analysis as needed. Use `[[display|/path]]` for cross-references and `*italic*` for emphasis.}',
        },
      ],
    },
    {
      heading: 'Provenance',
      blocks: [
        {
          type: 'paragraph',
          text: '{Recovery, custody chain, acquisition notes. Where it came from, how it was retrieved, who holds it now, what restrictions apply.}',
        },
      ],
    },
  ],
  statBlocks: [
    {
      title: 'Profile',
      stats: [
        { label: 'Class', value: '{Class}', variant: 'accent' },
        { label: 'Type', value: '{Type}' },
        { label: 'Weight', value: '{kg}' },
        { label: 'Origin', value: '{Origin}' },
      ],
    },
    {
      title: 'Acquisition',
      stats: [
        { label: 'Recovered', value: '{Cycle}' },
        { label: 'Location', value: '{Storage location}' },
        { label: 'Clearance', value: '{Tier}', variant: 'accent' },
      ],
    },
  ],
  footer: {
    media: ['text', 'image'],
    viewingHistory: [
      { who: '{Latest viewer}', when: '{Cycle / day / time}' },
      { who: '{Prior viewer}', when: '{Cycle / day / time}' },
      { who: 'archive.accession', when: '{Cycle / day / time}' },
    ],
  },
}
