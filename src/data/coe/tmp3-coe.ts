import type { COETemplate } from '../../types'

// TMP3 — Correction of Error / Retrospective schema reference. Structured
// per Amazon's COE guidelines: Issue Summary → Customer Impact →
// Incident Response Analysis (TTD/TTE/TTR) → Timeline → Five Whys →
// Lessons Learned → Action Items → Related Items.

export const tmp3COE: COETemplate = {
  kind: 'coe',
  pageNumber: 'TMP3',
  drift: 0.0,
  slug: 'tmp3-coe',
  filename: 'tmp3-coe.coe',
  filetype: 'COE',
  author: 'Incident Review Board',
  sharedWith: ['Sector 9 — All Hands', 'Incident Review Board'],
  meta: [
    { label: 'Severity', value: 'SEV-1' },
    { label: 'Status', value: '{Phase 1 Mitigation Complete · Action Items In Progress}' },
  ],
  incidentId: '{COE-XXXX-NNN}',
  title: '{COE Name}',
  service: '{Affected service / team}',
  status: '{Phase 1 Mitigation Complete · Action Items In Progress}',
  severity: 'SEV-1',
  detected: '{Cycle / day / time standard · TTD anchor}',
  mitigated: '{Cycle / day / time standard}',
  resolved: '{Cycle / day / time standard · optional}',
  filed: '{Cycle / day / time standard}',
  authors: ['{Author name + ID}'],
  reviewers: ['{Reviewer name + ID}'],

  issueSummary: [
    {
      type: 'paragraph',
      text: '**Issue Summary** is a 1–2 paragraph blameless overview of what happened. State the customer-facing surface first, then the root mechanism in plain language. Avoid jargon; assume the reader is reading this six months from now without context.',
    },
    {
      type: 'paragraph',
      text: 'COEs are written for SEV-1 incidents (and occasionally SEV-2). Lower severities are tracked as operational notes, not COEs. The author should call out the SEV designation explicitly here, with the reasoning for the rating.',
    },
  ],

  customerImpact: [
    {
      type: 'paragraph',
      text: '**Customer Impact** quantifies who was affected and how. State the impact in concrete terms: number of sessions, duration, breached SLAs, rerouted traffic, lost requests. Distinguish reader-facing impact from internal operational impact; both are worth recording but they are not the same.',
    },
    {
      type: 'paragraph',
      text: 'If the impact is unrecoverable (e.g., readers extracted information from a polluted state and the institution cannot recall it), say so explicitly. Do not paper over unrecoverable impact with passive voice.',
    },
  ],

  incidentResponseAnalysis: {
    ttd: {
      value: '{Hh Mm}',
      rationale: '{Why TTD was what it was — what alerted us, what didn\'t, who was on console.}',
      improvement: '{What we\'d change to detect faster next time. "None" is acceptable when TTD is within tolerance.}',
    },
    tte: {
      value: '{Hh Mm}',
      rationale: '{Why engagement took as long as it did — paging chain, on-call rotation, escalation.}',
      improvement: '{Improvements to TTE, or "None".}',
    },
    ttr: {
      value: '{Hh Mm}',
      rationale: '{Dominant contributors to resolution time. Identify the bottleneck.}',
      improvement: '{Improvements to TTR. Cite specific Action Items below by number.}',
    },
  },

  timeline: [
    { timestamp: '{Cycle / day / time}', event: '{Initial trigger event — first observable failure.}' },
    { timestamp: '{Cycle / day / time}', event: '{Detection — automated alert, manual catch, or external report.}' },
    { timestamp: '{Cycle / day / time}', event: '{Engagement — on-call paged, primary responder acknowledged.}' },
    { timestamp: '{Cycle / day / time}', event: '{Mitigation — service returned to nominal customer-facing state.}' },
    { timestamp: '{Cycle / day / time}', event: '{Resolution — full recovery, including any cleanup work.}' },
    { timestamp: '{Cycle / day / time}', event: '{COE filed and reviewed.}' },
  ],

  fiveWhys: [
    '{First why — what was the proximate cause of the customer-facing failure?}',
    '{Second why — what condition allowed the proximate cause to occur?}',
    '{Third why — what process or design choice produced that condition?}',
    '{Fourth why — what missing safeguard would have prevented the choice or its consequence?}',
    '{Fifth why — what organizational or institutional pattern is the root.}',
  ],

  lessonsLearned: [
    {
      type: 'paragraph',
      text: '**Lessons Learned** captures the principles the institution should carry forward. Each lesson is general — not a re-statement of the action items below. Lessons should be readable as standalone sentences in a runbook six months from now.',
    },
    {
      type: 'paragraph',
      text: 'Reaffirm policies that worked, not only those that failed. A working response under pressure is itself worth documenting; the next responder benefits from knowing what held.',
    },
  ],

  actionItems: [
    {
      description: '{Action item — concrete, owned, dated. Reference rationale in lessons / response analysis if helpful.}',
      owner: '{Owner name}',
      priority: 'P0',
      dueDate: '{Cycle / day}',
      status: 'In Progress',
    },
    {
      description: '{Action item — P1 priority example.}',
      owner: '{Owner name}',
      priority: 'P1',
      dueDate: '{Cycle / day}',
      status: 'Not Started',
    },
    {
      description: '{Action item — P2 priority example.}',
      owner: '{Owner name}',
      priority: 'P2',
      dueDate: '{Cycle / day}',
      status: 'Not Started',
    },
    {
      description: '{Action item — P3 priority example. Communications / cultural / ceremonial work typically lands here.}',
      owner: '{Owner name}',
      priority: 'P3',
      dueDate: '{Cycle / day}',
      status: 'Not Started',
    },
  ],

  relatedItems: [
    { id: '{COE-XXXX-NNN}', title: '{Title of prior related COE — e.g. similar root cause}' },
    { id: '{OPS-XXXX-NNN}', title: '{Title of related operational ticket}' },
  ],

  footer: {
    viewingHistory: [
      { who: '{Director or VP review}', when: '{Cycle / day / time}' },
      { who: '{Author}', when: '{Cycle / day / time}' },
      { who: 'archive.audit', when: '{Cycle / day / time}' },
    ],
  },
}
