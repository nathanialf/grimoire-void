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
    if (block.type === 'table') {
      return (
        <table key={i} className={shared.table}>
          {block.caption && <caption className={shared.tableCaption}>{block.caption}</caption>}
          <thead>
            <tr>
              {block.columns.map((c, ci) => (
                <th key={ci} scope="col" className={shared.tableHeader}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className={shared.tableCell}>{renderText(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    return <p key={i}>{renderText(block.text)}</p>
  })
}
