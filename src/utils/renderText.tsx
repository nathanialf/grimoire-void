import { type ReactNode } from 'react'
import { InlineLink } from '../components/InlineLink'

export function renderText(text: string): ReactNode {
  // Split on both *italic* and [[text|path]] patterns
  const parts = text.split(/(\*[^*]+\*|\[\[[^\]]+\]\])/)
  if (parts.length === 1) return text

  return parts.map((part, i) => {
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
