import type { CommTemplate } from '../../types'

// TMP1 — Communication schema reference. Models an in-fiction message
// between named individuals or groups. Three variants ('1:1', 'group',
// 'all-hands') share the same schema; this template uses '1:1'.

export const tmp1Comm: CommTemplate = {
  kind: 'comm',
  pageNumber: 'TMP1',
  drift: 0.0,
  slug: 'tmp1-comm',
  filename: 'tmp1-comm.cmm',
  filetype: 'COMMUNICATION',
  author: '{Sender display name}',
  sharedWith: ['{Primary recipient}', '{Optional cc recipient}'],
  meta: [
    { label: 'Subject', value: '{Subject line — concise, action-oriented if possible}' },
    { label: 'Sent', value: '{Timestamp · cycle / day / time standard}' },
  ],
  variant: '1:1',
  title: '{Communication Name}',
  subject: '{Subject line — concise, action-oriented if possible}',
  from: '{Sender display name}',
  to: ['{Primary recipient}'],
  cc: ['{Optional cc recipient}'],
  sent: '{Timestamp · cycle / day / time standard}',
  body: [
    {
      type: 'paragraph',
      text: '**Purpose.** The communication schema models an in-fiction message between named individuals or groups. Use this template when surfacing a 1:1 exchange, a small-group thread, or an all-hands broadcast. The variant field (`1:1` / `group` / `all-hands`) sets the eyebrow label in the header chrome and is the only structural difference between the three.',
    },
    {
      type: 'paragraph',
      text: '**Fields.** *Subject* is the message subject line — keep it concrete. *From* is a single sender; *To* is one or more recipients; *Cc* is optional and may be omitted entirely. *Sent* is an in-fiction timestamp. The *body* is an array of `ContentBlock`s: paragraphs, optional `quote` blocks for inline replies or pulled excerpts.',
    },
    {
      type: 'paragraph',
      text: '**Body conventions.** Paragraphs render as monospaced prose. Use `[[display|/path]]` syntax for cross-references to other wiki entries; the link will route through the wiki navigation. Use `*italic*` for emphasis. Communications do not use quote blocks — quote blocks are reserved for documents that pull a third-party voice (reports, lore, retrospectives). Inline replies in a thread should be formatted as their own paragraphs, prefixed with `> ` or a sender attribution if needed.',
    },
    {
      type: 'paragraph',
      text: '**Length.** Communication bodies are short — usually 2–8 short paragraphs. If the message would be longer than that in fiction, consider whether it should be a memo or a meeting transcript instead.',
    },
    {
      type: 'paragraph',
      text: '**Footer.** All document templates share the same footer: a *Viewing History* section. The media-presence indicator (`text [X] image [ ] audio [ ] video [ ]`) and the drift score live in the header chrome — see `documents.md` for details.',
    },
  ],
  footer: {
    viewingHistory: [
      { who: '{Latest viewer}', when: '{Cycle / day / time}' },
      { who: '{Prior viewer}', when: '{Cycle / day / time}' },
      { who: 'archive.audit', when: '{Cycle / day / time}' },
    ],
  },
}
