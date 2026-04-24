import { type ReactNode } from 'react'
import type { ContentBlock } from '../types'
import { renderText } from './renderText'

export function renderBlocks(blocks: ContentBlock[], shared: Record<string, string>): ReactNode {
  return blocks.map((block, i) => {
    if (block.type === 'quote') {
      return (
        <blockquote key={i} className={shared.quote}>
          {renderText(block.text)}
          <span className={shared.quoteSource}>{`— ${block.source}`}</span>
        </blockquote>
      )
    }
    return <p key={i}>{renderText(block.text)}</p>
  })
}
