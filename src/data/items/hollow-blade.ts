import type { ItemData } from '../../types'

export const hollowBlade: ItemData = {
  pageNumber: '024',
  header: {
    classification: 'Artifact — Void-Touched',
    title: 'The Hollow Blade',
    subtitle: 'A weapon that remembers what it has unmade',
    tags: ['artifact', 'cursed', 'void-forged', 'class-v restricted'],
  },
  image: {
    aspect: 'square',
    placeholderLabel: '[ artifact diagram: the hollow blade, lateral cross-section ]',
    caption: 'Fig. 24 — Recovered from Relay Station Omicron-7, Docking Bay C1. Handle wrapping is non-original.',
  },
  sections: [
    {
      heading: 'Artifact Analysis',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Hollow Blade was recovered from the wreckage of [[Relay Station Omicron-7|/location/sunken-relay]] during the Cycle 4419 salvage operation. The weapon was found embedded in the operations center bulkhead at an angle inconsistent with any known physical force — metallurgical analysis suggests the blade was not driven into the wall but rather that the wall formed around it, as though the structure had grown to enclose the object.',
        },
        {
          type: 'paragraph',
          text: 'The blade itself is composed of an unidentified alloy that resists all standard spectroscopic analysis. Its most distinctive property is a persistent mass deficit: the weapon weighs approximately 40% less than its volume and material density would predict. This "hollowness" gives the weapon its designation and contributes to the unsettling tactile sensation reported by handlers — the feeling of gripping something that is not entirely present.',
        },
        {
          type: 'paragraph',
          text: 'Personnel who carry the blade for extended periods report auditory phenomena: a faint resonance described variously as "whispering," "counting," or "reading names from a list." Psych evaluation of affected operatives shows no pathology. The sounds cease immediately upon releasing the weapon.',
        },
      ],
    },
    {
      heading: 'Acquisition Notes',
      blocks: [
        {
          type: 'paragraph',
          text: 'Recovery required three attempts. The first two teams reported spatial disorientation upon approaching the artifact, with one operative experiencing a 72-hour amnestic episode. The successful third extraction was performed by Operative [[Aria Vex|/character/aria-vex]], who reported no adverse effects beyond mild tinnitus lasting approximately six hours.',
        },
        {
          type: 'paragraph',
          text: 'The blade is currently held in Sector 9 deep storage, Vault 11-C. Access requires Omega-level clearance and dual authorization from the Meridian Compact oversight committee. Removal for field use is permitted only under [[Protocol Sable|/report/sable-threshold]].',
        },
      ],
    },
  ],
  statBlocks: [
    {
      title: 'Weapon Profile',
      stats: [
        { label: 'Class', value: 'V Restricted', variant: 'danger' },
        { label: 'Type', value: 'Melee — Blade' },
        { label: 'Damage', value: '???', variant: 'accent' },
        { label: 'Weight', value: '1.1 kg (anom.)' },
        { label: 'Reach', value: '0.8m' },
        { label: 'Void Sig.', value: 'EXTREME', variant: 'danger' },
        { label: 'Durability', value: 'Indestructible' },
        { label: 'Curse', value: 'Active', variant: 'danger' },
      ],
    },
    {
      title: 'Provenance',
      stats: [
        { label: 'Origin', value: 'Unknown' },
        { label: 'Recovered', value: 'Cy. 4419' },
        { label: 'Location', value: 'Vault 11-C' },
        { label: 'Clearance', value: 'Omega', variant: 'accent' },
      ],
    },
  ],
}
