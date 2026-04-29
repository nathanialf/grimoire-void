import type { SurveyTemplate } from '../../types'

// TMP5 — Field Survey / Site Report. Sections locked to match the
// existing wiki survey/report structure (see sable-threshold.ts,
// glass-litany.ts).

export const tmp5Survey: SurveyTemplate = {
  kind: 'survey',
  pageNumber: 'TMP5',
  drift: 0.0,
  header: {
    classification: '{Survey classification — e.g. "Field Survey · Site Report"}',
    title: '{Operation or site name}',
    subtitle: '{Cycle / day · theater}',
  },
  image: {
    aspect: 'wide',
    placeholderLabel: '{Terminal-aesthetic site photo · optional per survey}',
    caption: '{Fig. NN — short factual caption identifying the site, angle, and date.}',
  },
  sections: [
    {
      heading: 'Executive Summary',
      blocks: [
        {
          type: 'paragraph',
          text: '{1–3 short paragraphs summarizing the survey: where, when, what was assessed, the headline conclusion. Lead with the customer-facing finding if applicable.}',
        },
      ],
    },
    {
      heading: 'Findings',
      blocks: [
        {
          type: 'paragraph',
          text: '{Describe what was observed at the site. Conditions, hazards, anomalies. Authors may add additional sections per case (e.g., environmental, structural, security).}',
        },
      ],
    },
  ],
  missionStats: {
    title: 'Operation Details',
    stats: [
      { label: 'Designation', value: '{Survey ID or operation code}' },
      { label: 'Authorization', value: '{Authorizing officer}' },
      { label: 'Cycle', value: '{Cycle range}' },
      { label: 'Theater', value: '{Site name and floor or region}' },
      { label: 'Objective', value: '{One-line objective statement}' },
      { label: 'Team Size', value: '{N operatives}', variant: 'accent' },
      { label: 'Status', value: '{COMPLETE / IN PROGRESS / FAILURE}', variant: 'accent' },
    ],
  },
  timeline: [
    { timestamp: '{Cycle / day / time}', event: '{Survey kickoff at site entry; team accounted for.}' },
    { timestamp: '{Cycle / day / time}', event: '{Mid-survey milestone or notable observation.}' },
    { timestamp: '{Cycle / day / time}', event: '{Survey concluded; team off-site; data handed to records.}' },
  ],
  casualties: [],
  recommendations: [
    '{Recommendation 1 — short, action-oriented. Owner + due date if applicable.}',
    '{Recommendation 2 — keep recommendations crisp; longer rationale belongs in body sections.}',
    '{Recommendation 3 — number the items in priority order if priority is implied.}',
  ],
  footer: {
    media: ['text', 'image'],
    viewingHistory: [
      { who: '{Latest viewer}', when: '{Cycle / day / time}' },
      { who: '{Survey lead (author)}', when: '{Cycle / day / time}' },
      { who: 'archive.facilities', when: '{Cycle / day / time}' },
    ],
  },
}
