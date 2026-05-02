import { type ReactNode } from 'react'
import { InlineLink } from '../components/InlineLink'
import { REDACT_MARKER } from './scrambleText'
import shared from '../styles/shared.module.css'

export function renderText(text: string): ReactNode {
  // Redact marker (U+200B prepended by scrambleText) flags this string
  // as a length-matched scramble. Strip the marker, run the rest
  // through the normal split, then wrap the whole result in the
  // `.redact` class so the scramble reads as red noise instead of
  // authored content.
  const isRedacted = text.startsWith(REDACT_MARKER)
  const body = isRedacted ? text.slice(REDACT_MARKER.length) : text

  // Split on both *italic* and [[text|path]] patterns
  const parts = body.split(/(\*[^*]+\*|\[\[[^\]]+\]\])/)

  let rendered: ReactNode
  if (parts.length === 1) {
    rendered = body
  } else {
    rendered = parts.map((part, i) => {
      // Italic
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>
      }
      // Inline link
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const inner = part.slice(2, -2)
        const segments = inner.split('|')
        if (segments.length >= 2) {
          const [display, path, variant] = segments
          return (
            <InlineLink key={i} to={path} variant={variant as 'danger' | undefined}>
              {display}
            </InlineLink>
          )
        }
      }
      return part
    })
  }

  if (isRedacted) {
    return <span className={shared.redact}>{rendered}</span>
  }
  return rendered
}
