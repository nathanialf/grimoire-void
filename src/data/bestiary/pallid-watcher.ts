import type { BestiaryData } from '../../types'

export const pallidWatcher: BestiaryData = {
  pageNumber: '013',
  header: {
    classification: 'Hostile Entity — Class IV',
    title: 'The Pallid Watcher',
    subtitle: 'That which observes from the threshold',
    tags: ['void-born', 'psionic', 'apex predator', 'non-euclidean'],
  },
  image: {
    aspect: 'wide',
    placeholderLabel: '[ illustration: the pallid watcher ]',
    caption: 'Fig. 13 — Observed manifestation near Relay Station Omicron-7. Note the secondary ocular cluster.',
  },
  sections: [
    {
      heading: 'Field Report',
      blocks: [
        {
          type: 'paragraph',
          text: 'First documented during the [[Omicron Collapse|/lore/omicron-collapse]] of Cycle 4417, the Pallid Watcher is a Class IV void-born entity characterized by its translucent dermal layer and the distinctive array of photo-sensitive organs arranged along its cranial ridge. Survivors consistently report a sensation of "being studied" in the moments before visual contact.',
        },
        {
          type: 'paragraph',
          text: 'The entity does not appear to occupy a fixed position in three-dimensional space. Tracking instruments register its mass signature across multiple spatial coordinates simultaneously, suggesting either rapid translocation or a form of dimensional superposition not yet understood by current Sector 9 physics models.',
        },
        {
          type: 'quote',
          text: 'It did not move toward us. We moved toward it. We had always been moving toward it.',
          source: 'Field Log 4417-C, Operative Yael Mox (posthumous)',
        },
        {
          type: 'paragraph',
          text: 'Engagement protocol designates the Pallid Watcher as OBSERVE ONLY. No offensive action has proven effective. Personnel are advised to maintain minimum 300-meter distance and avoid direct ocular contact, which appears to trigger the entity\'s secondary predation phase.',
        },
      ],
    },
  ],
  statBlocks: [
    {
      title: 'Combat Profile',
      stats: [
        { label: 'Threat', value: 'EXTREME', variant: 'danger' },
        { label: 'Type', value: 'Void-born' },
        { label: 'HP', value: '???', variant: 'accent' },
        { label: 'Armor', value: 'N/A' },
        { label: 'Speed', value: 'Variable' },
        { label: 'Range', value: '300m+' },
        { label: 'Psionic', value: 'Class IV', variant: 'danger' },
        { label: 'Weakness', value: 'Unknown' },
      ],
    },
    {
      title: 'Encounter Data',
      stats: [
        { label: 'First Seen', value: 'Cy. 4417' },
        { label: 'Sightings', value: '7' },
        { label: 'Survivors', value: '1', variant: 'danger' },
        { label: 'Status', value: 'ACTIVE', variant: 'accent' },
      ],
    },
  ],
}
