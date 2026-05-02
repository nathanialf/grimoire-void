import type {
  ActionItem,
  ContentBlock,
  IncidentResponseAnalysis,
  RelatedIncident,
  ResponseMetric,
  Section,
  ServiceEntry,
  TemplateData,
} from '../types'
import type { RevealRef } from '../data/variations'
import { scrambleText, seedFor } from './scrambleText'

// Aggregates per-field index sets out of a flat list of reveal refs.
// The `sections` field is nested (sectionIndex → block-index set);
// the rest are flat top-level arrays so they collapse to a single
// Set<number>.
type FlatField = Exclude<RevealRef, { field: 'sections' }>['field']
interface RevealMap {
  body: Set<number>
  dossier: Set<number>
  serviceRecord: Set<number>
  issueSummary: Set<number>
  customerImpact: Set<number>
  lessonsLearned: Set<number>
  incidentResponseAnalysis: Set<number>
  timeline: Set<number>
  fiveWhys: Set<number>
  actionItems: Set<number>
  relatedItems: Set<number>
  casualties: Set<number>
  recommendations: Set<number>
  sections: Map<number, Set<number>>
}

function emptyRevealMap(): RevealMap {
  return {
    body: new Set(),
    dossier: new Set(),
    serviceRecord: new Set(),
    issueSummary: new Set(),
    customerImpact: new Set(),
    lessonsLearned: new Set(),
    incidentResponseAnalysis: new Set(),
    timeline: new Set(),
    fiveWhys: new Set(),
    actionItems: new Set(),
    relatedItems: new Set(),
    casualties: new Set(),
    recommendations: new Set(),
    sections: new Map(),
  }
}

function buildRevealMap(refs: RevealRef[]): RevealMap {
  const m = emptyRevealMap()
  for (const r of refs) {
    if (r.field === 'sections') {
      const set = m.sections.get(r.sectionIndex) ?? new Set<number>()
      set.add(r.blockIndex)
      m.sections.set(r.sectionIndex, set)
    } else {
      m[r.field as FlatField].add(r.index)
    }
  }
  return m
}

// ── Per-shape redactors ──
//
// Each redactor consumes the original item plus a stable seed and
// returns a same-shape replacement whose text fields are scramble
// strings of identical length to the source. Enum-typed fields
// (priority, status, casualty status) are pinned to neutral defaults
// rather than scrambled, since they're structural metadata, not
// narrative text — the scramble register only applies to prose.

function redactBlock(b: ContentBlock, seed: number): ContentBlock {
  switch (b.type) {
    case 'paragraph':
      return { type: 'paragraph', text: scrambleText(b.text.length, seed) }
    case 'quote':
      return {
        type: 'quote',
        text: scrambleText(b.text.length, seed),
        source: scrambleText(b.source.length, seedFor(seed, 'src')),
      }
    case 'table':
      return {
        type: 'table',
        caption: b.caption !== undefined ? scrambleText(b.caption.length, seed) : undefined,
        columns: b.columns.map((c, i) =>
          scrambleText(c.length, seedFor(seed, 'col', i)),
        ),
        rows: b.rows.map((row, ri) =>
          row.map((cell, ci) =>
            scrambleText(cell.length, seedFor(seed, 'r', ri, 'c', ci)),
          ),
        ),
      }
    case 'image':
    case 'audio':
    case 'video':
      // Inline media blocks aren't textual; substitute a paragraph-
      // shaped scramble so the body still carries a redaction marker.
      return { type: 'paragraph', text: scrambleText(40, seed) }
  }
}

function redactMetric(m: ResponseMetric, seed: number): ResponseMetric {
  return {
    value: scrambleText(m.value.length, seed),
    rationale: scrambleText(m.rationale.length, seedFor(seed, 'rat')),
    improvement:
      m.improvement !== undefined
        ? scrambleText(m.improvement.length, seedFor(seed, 'imp'))
        : undefined,
  }
}

function redactTimelineEntry(
  t: { timestamp: string; event: string },
  seed: number,
): { timestamp: string; event: string } {
  return {
    timestamp: scrambleText(t.timestamp.length, seed),
    event: scrambleText(t.event.length, seedFor(seed, 'ev')),
  }
}

function redactActionItem(a: ActionItem, seed: number): ActionItem {
  return {
    description: scrambleText(a.description.length, seed),
    owner: scrambleText(a.owner.length, seedFor(seed, 'own')),
    priority: 'P3',
    dueDate: scrambleText(a.dueDate.length, seedFor(seed, 'due')),
    status: 'Not Started',
  }
}

function redactRelatedIncident(r: RelatedIncident, seed: number): RelatedIncident {
  // Drop `path` so the redacted row doesn't link anywhere — clicking a
  // scrambled link to a real route would defeat the redaction.
  return {
    id: scrambleText(r.id.length, seed),
    title: scrambleText(r.title.length, seedFor(seed, 'title')),
  }
}

function redactCasualty(
  c: { status: 'KIA' | 'MIA' | 'LOST'; text: string },
  seed: number,
): { status: 'KIA' | 'MIA' | 'LOST'; text: string } {
  return {
    status: 'LOST' as const,
    text: scrambleText(c.text.length, seed),
  }
}

function redactServiceEntry(e: ServiceEntry, seed: number): ServiceEntry {
  return {
    date: scrambleText(e.date.length, seed),
    entry: scrambleText(e.entry.length, seedFor(seed, 'ent')),
  }
}

// ── Generic crop helpers ──

// Walks a flat array and replaces each unrevealed index with a
// scrambled redaction of the original item — preserving positions and
// matching each item's visual length. The N-row structure of the
// original list survives partial state; only the contents read as
// redaction noise.
function cropArrayByIndex<T>(
  arr: T[],
  visible: Set<number>,
  redact: (item: T, index: number) => T,
): T[] {
  if (arr.length === 0) return arr
  if (visible.size >= arr.length) return arr
  return arr.map((item, i) => (visible.has(i) ? item : redact(item, i)))
}

function cropSections(
  sections: Section[],
  byIndex: Map<number, Set<number>>,
  fieldKey: string,
): Section[] {
  return sections.map((s, sectionIndex) => {
    const visible = byIndex.get(sectionIndex) ?? new Set<number>()
    return {
      ...s,
      blocks: cropArrayByIndex(s.blocks, visible, (b, i) =>
        redactBlock(b, seedFor(fieldKey, sectionIndex, i)),
      ),
    }
  })
}

function cropIRA(
  ira: IncidentResponseAnalysis,
  visible: Set<number>,
): IncidentResponseAnalysis {
  // IRA is a fixed 3-slot object (ttd / tte / ttr at indices 0 / 1 / 2)
  // rather than an array. Each slot is independently revealed; hidden
  // slots become length-matched scramble metrics so the rendered table
  // keeps three labeled rows even when redacted.
  return {
    ttd: visible.has(0) ? ira.ttd : redactMetric(ira.ttd, seedFor('ira', 'ttd')),
    tte: visible.has(1) ? ira.tte : redactMetric(ira.tte, seedFor('ira', 'tte')),
    ttr: visible.has(2) ? ira.ttr : redactMetric(ira.ttr, seedFor('ira', 'ttr')),
  }
}

// Replaces each croppable field in the doc with a per-index redacted
// view: items at revealed indices show authored content; items at
// unrevealed indices become length-matched scramble shaped exactly
// like the original (paragraphs, action-item rows, timeline events,
// etc.). Mirrors blocksOf in src/data/index.ts so the set of body
// fields stays consistent — if a new content-bearing field is added
// to a kind there, it should be cropped here too.
//
// Per-fragment binding: each authored VariationNode declares which
// doc positions its scan unlocks (see src/data/variations.ts). Two
// players with the same gathered count but different gathered NODES
// see different reveals — the wiki reflects exactly which fragments
// have been recovered, not how many.
//
// Structural elements that frame the doc rather than carry it (header
// chrome, MetaTable rows for incident/profile metadata, missionStats,
// statBlocks, classNotice, footer, image panels, section headings) are
// left intact — the player needs to see the document is filed, just
// not what it says.
export function applyPartial(doc: TemplateData, refs: RevealRef[]): TemplateData {
  const m = buildRevealMap(refs)
  switch (doc.kind) {
    case 'comm':
      return {
        ...doc,
        body: cropArrayByIndex(doc.body, m.body, (b, i) =>
          redactBlock(b, seedFor('body', i)),
        ),
      }
    case 'profile':
      return {
        ...doc,
        dossier: cropArrayByIndex(doc.dossier, m.dossier, (b, i) =>
          redactBlock(b, seedFor('dossier', i)),
        ),
        sections: cropSections(doc.sections, m.sections, 'profile-sections'),
        serviceRecord: cropArrayByIndex(doc.serviceRecord, m.serviceRecord, (e, i) =>
          redactServiceEntry(e, seedFor('serviceRecord', i)),
        ),
      }
    case 'coe':
      return {
        ...doc,
        issueSummary: cropArrayByIndex(doc.issueSummary, m.issueSummary, (b, i) =>
          redactBlock(b, seedFor('issueSummary', i)),
        ),
        customerImpact: cropArrayByIndex(doc.customerImpact, m.customerImpact, (b, i) =>
          redactBlock(b, seedFor('customerImpact', i)),
        ),
        lessonsLearned: cropArrayByIndex(doc.lessonsLearned, m.lessonsLearned, (b, i) =>
          redactBlock(b, seedFor('lessonsLearned', i)),
        ),
        incidentResponseAnalysis: cropIRA(doc.incidentResponseAnalysis, m.incidentResponseAnalysis),
        timeline: cropArrayByIndex(doc.timeline, m.timeline, (t, i) =>
          redactTimelineEntry(t, seedFor('timeline', i)),
        ),
        fiveWhys: cropArrayByIndex(doc.fiveWhys, m.fiveWhys, (s, i) =>
          scrambleText(s.length, seedFor('fiveWhys', i)),
        ),
        actionItems: cropArrayByIndex(doc.actionItems, m.actionItems, (a, i) =>
          redactActionItem(a, seedFor('actionItems', i)),
        ),
        relatedItems: doc.relatedItems
          ? cropArrayByIndex(doc.relatedItems, m.relatedItems, (r, i) =>
              redactRelatedIncident(r, seedFor('relatedItems', i)),
            )
          : doc.relatedItems,
      }
    case 'artifact':
      return {
        ...doc,
        sections: cropSections(doc.sections, m.sections, 'artifact-sections'),
      }
    case 'survey':
      return {
        ...doc,
        sections: cropSections(doc.sections, m.sections, 'survey-sections'),
        timeline: cropArrayByIndex(doc.timeline, m.timeline, (t, i) =>
          redactTimelineEntry(t, seedFor('timeline', i)),
        ),
        casualties: cropArrayByIndex(doc.casualties, m.casualties, (c, i) =>
          redactCasualty(c, seedFor('casualties', i)),
        ),
        recommendations: cropArrayByIndex(doc.recommendations, m.recommendations, (s, i) =>
          scrambleText(s.length, seedFor('recommendations', i)),
        ),
      }
  }
}
