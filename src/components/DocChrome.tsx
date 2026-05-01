import { ChapterDivider } from './ChapterDivider'
import { PixelatedText } from './PixelatedText'
import styles from '../styles/DocChrome.module.css'
import metaStyles from '../styles/MetaTable.module.css'
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
// alongside the rest of the document's metadata. Rows render through
// PixelatedText (soft CA) to match the EntryHeader chrome treatment.
export function DocFooter({ footer }: { footer: TemplateFooter }) {
  return (
    <>
      <ChapterDivider label="Viewing History" />
      <div className={metaStyles.table}>
        {footer.viewingHistory.map((v, i) => (
          <div key={i} className={metaStyles.row}>
            <span className="visually-hidden">{`${v.when} — ${v.who}`}</span>
            <span className={metaStyles.label} aria-hidden="true">
              <PixelatedText renderSize={7} letterSpacing={0.6} textTransform="uppercase">{v.when}</PixelatedText>
            </span>
            <span className={metaStyles.value} aria-hidden="true">
              <PixelatedText renderSize={7} letterSpacing={0.4}>{v.who}</PixelatedText>
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
