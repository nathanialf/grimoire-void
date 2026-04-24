export interface Stat {
  label: string
  value: string
  variant?: 'danger' | 'accent'
}

export interface StatBlockData {
  title?: string
  stats: Stat[]
}

export interface ImageConfig {
  aspect?: 'tall' | 'wide' | 'square'
  src?: string
  alt?: string
  caption?: string
  placeholderLabel?: string
}

export interface PoiItem {
  marker: string
  name: string
  desc: string
}

export interface EquipItem {
  name: string
  desc: string
}

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string; source: string }

export interface Section {
  heading: string
  blocks: ContentBlock[]
}

export interface ClassNotice {
  header: string
  body: string[]
  footer: string
}

export interface EntryHeaderData {
  classification?: string
  title: string
  subtitle?: string
  tags?: string[]
}

export interface CharacterData {
  pageNumber: string
  header: EntryHeaderData
  image: ImageConfig
  sections: Section[]
  equipment: EquipItem[]
  statBlocks: StatBlockData[]
  classNotice?: ClassNotice
}

export interface BestiaryData {
  pageNumber: string
  header: EntryHeaderData
  image: ImageConfig
  sections: Section[]
  statBlocks: StatBlockData[]
  classNotice?: ClassNotice
}

export interface ItemData {
  pageNumber: string
  header: EntryHeaderData
  image: ImageConfig
  sections: Section[]
  statBlocks: StatBlockData[]
  classNotice?: ClassNotice
}

export interface LocationData {
  pageNumber: string
  header: EntryHeaderData
  image: ImageConfig
  sections: Section[]
  poi: PoiItem[]
  statBlocks: StatBlockData[]
  classNotice?: ClassNotice
}

export interface MapData {
  pageNumber: string
  header: EntryHeaderData
  image: ImageConfig
  sections: Section[]
  poi: PoiItem[]
  classNotice?: ClassNotice
}

export interface LoreData {
  pageNumber: string
  header: EntryHeaderData
  sections: Section[]
  classNotice?: ClassNotice
}

export interface ReportData {
  pageNumber: string
  header: EntryHeaderData
  sections: Section[]
  missionStats: StatBlockData
  timeline: { timestamp: string; event: string }[]
  casualties: { status: 'KIA' | 'MIA' | 'LOST'; text: string }[]
  recommendations: string[]
  classNotice?: ClassNotice
}
