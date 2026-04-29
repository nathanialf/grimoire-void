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
  | { type: 'table'; caption?: string; columns: string[]; rows: string[][] }

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

// ── Diegetic document templates ──
// One example per committed schema (see docs/private/systems/documents.md):
// emails, HR docs, employee profile pages, COEs / retrospectives. Each kind
// has its own header / body chrome; the footer is shared (media toggle +
// viewing history) per the documents spec.

export type DocMedia = 'text' | 'audio' | 'video' | 'image'

export interface ViewingHistoryEntry {
  who: string
  when: string
}

export interface TemplateFooter {
  media: DocMedia[]
  viewingHistory: ViewingHistoryEntry[]
}

// Drift-score chrome field. Present on every template kind. Rendered as a
// dim, unlabeled strip in the document's header chrome — the player sees a
// number on every document and is never told what it means. Higher = more
// drift in the reconstruction. Per drift.md: drift felt, not explicated.
export interface ChromeMeta {
  drift: number
}

export interface EmailTemplate extends ChromeMeta {
  kind: 'email'
  pageNumber: string
  variant: '1:1' | 'group' | 'all-hands'
  title: string
  subtitle?: string
  subject: string
  from: string
  to: string[]
  cc?: string[]
  sent: string
  body: ContentBlock[]
  footer: TemplateFooter
}

export interface ProfileChainEntry {
  role: string
  name: string
  employeeNumber: string
}

export interface ServiceEntry {
  date: string
  entry: string
}

export interface ProfileTemplate extends ChromeMeta {
  kind: 'profile'
  pageNumber: string
  name: string
  employeeNumber: string
  role: string
  department: string
  location: string
  manager: ProfileChainEntry
  reports: ProfileChainEntry[]
  // Free-typed prose. The load-bearing biographical narrative; other
  // documents cite it as the portable description of the subject.
  dossier: ContentBlock[]
  // Chronological postings, transfers, role changes, awards. Required
  // for all personnel — the institution maintains this for every active
  // record. Renders in the sidebar.
  serviceRecord: ServiceEntry[]
  sections: Section[]
  footer: TemplateFooter
}

export interface RelatedIncident {
  id: string
  title: string
  path?: string
}

export interface ActionItem {
  description: string
  owner: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  dueDate: string
  status: 'Not Started' | 'In Progress' | 'Done' | 'Blocked'
}

export interface ResponseMetric {
  // The measured duration (e.g. "9h 12m"). Display verbatim.
  value: string
  // What drove the duration to this value.
  rationale: string
  // What we'd change to reduce it next time. Optional — sometimes "None".
  improvement?: string
}

// Amazon COE's Incident Response Analysis section: three measured response
// times with rationale and improvement opportunities for each.
export interface IncidentResponseAnalysis {
  ttd: ResponseMetric  // Time to Detect
  tte: ResponseMetric  // Time to Engage
  ttr: ResponseMetric  // Time to Resolve
}

// COE / retrospective document, structured per Amazon's Correction of Error
// guidelines: Issue Summary → Customer Impact → Incident Response Analysis →
// Timeline → Five Whys → Lessons Learned → Action Items → Related Items.
export interface COETemplate extends ChromeMeta {
  kind: 'coe'
  pageNumber: string
  // ── Header metadata (rendered as MetaTable directly under EntryHeader) ──
  incidentId: string
  title: string
  service: string
  status: string
  severity: 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4' | 'SEV-5'
  detected: string
  mitigated: string
  resolved?: string
  filed: string
  authors: string[]
  reviewers?: string[]
  // ── Body sections, in the canonical Amazon order ──
  issueSummary: ContentBlock[]
  customerImpact: ContentBlock[]
  incidentResponseAnalysis: IncidentResponseAnalysis
  timeline: { timestamp: string; event: string }[]
  fiveWhys: string[]
  lessonsLearned: ContentBlock[]
  actionItems: ActionItem[]
  relatedItems?: RelatedIncident[]
  footer: TemplateFooter
}

// Artifact template reuses the ItemData foundation (header / sections /
// statBlocks) and adds the template chrome (drift score, shared footer).
// Image is optional here — some artifacts are paper documents, accession
// records, or other contents-only entries that don't have a visual.
export interface ArtifactTemplate extends ChromeMeta, Omit<ItemData, 'image'> {
  kind: 'artifact'
  image?: ImageConfig
  footer: TemplateFooter
}

// Survey template reuses the ReportData foundation (header / image /
// sections / missionStats / timeline / recommendations) and adds the
// template chrome. Renders with the same layout as the existing wiki
// ReportPage. The image field is added on top of the base ReportData;
// reports in the wiki currently render without one, but documents.md
// permits per-doc inline images.
export interface SurveyTemplate extends ChromeMeta, ReportData {
  kind: 'survey'
  image?: ImageConfig
  footer: TemplateFooter
}

export type TemplateData =
  | EmailTemplate
  | ProfileTemplate
  | COETemplate
  | ArtifactTemplate
  | SurveyTemplate
