import { ChapterDivider } from './ChapterDivider'
import { MetaTable } from './MetaTable'
import styles from '../styles/DocChrome.module.css'
import type { TemplateFooter } from '../types'

// Drift score chrome, rendered as a dim unlabeled strip directly under
// the EntryHeader divider. The institution does not characterize its
// own apparatus; the player sees a number on every document and is
// never told what it means.
export function DriftStrip({ drift }: { drift: number }) {
  return (
    <div className={styles.driftStrip} aria-hidden="true">
      <span>{`Δ ${drift.toFixed(2)}`}</span>
    </div>
  )
}

// Shared document footer. Just the access log — the media indicator
// (text/image/audio/video presence) is rendered in the header chrome
// alongside the rest of the document's metadata.
export function DocFooter({ footer }: { footer: TemplateFooter }) {
  return (
    <>
      <ChapterDivider label="Viewing History" />
      <MetaTable rows={footer.viewingHistory.map((v) => ({
        label: v.when,
        value: v.who,
      }))} />
    </>
  )
}
