import { ChapterDivider } from './ChapterDivider'
import { MetaTable } from './MetaTable'
import { PixelatedText } from './PixelatedText'
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

// Shared document footer. One section ("Viewing History") containing the
// inline media-toggle indicator above the access log.
export function DocFooter({ footer }: { footer: TemplateFooter }) {
  const present = (m: 'text' | 'audio' | 'video' | 'image') =>
    footer.media.includes(m)
  return (
    <>
      <ChapterDivider label="Viewing History" />
      <div className={styles.mediaRow}>
        <MediaTag label="text" on={present('text')} />
        <MediaTag label="image" on={present('image')} />
        <MediaTag label="audio" on={present('audio')} />
        <MediaTag label="video" on={present('video')} />
      </div>
      <MetaTable rows={footer.viewingHistory.map((v) => ({
        label: v.when,
        value: v.who,
      }))} />
    </>
  )
}

function MediaTag({ label, on }: { label: string; on: boolean }) {
  return (
    <span className={`${styles.mediaTag} ${on ? styles.mediaTagOn : ''}`}>
      <PixelatedText renderSize={7} letterSpacing={1.4} textTransform="uppercase">
        {`${label} [${on ? 'X' : ' '}]`}
      </PixelatedText>
    </span>
  )
}
