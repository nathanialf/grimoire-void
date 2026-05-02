import { type ReactNode } from 'react'
import type { ContentBlock } from '../types'
import { ImagePanel } from '../components/ImagePanel'
import { renderText } from './renderText'

export function renderBlocks(blocks: ContentBlock[], shared: Record<string, string>): ReactNode {
  return blocks.map((block, i) => {
    if (block.type === 'quote') {
      return (
        <blockquote key={i} className={shared.quote}>
          {renderText(block.text)}
          <span className={shared.quoteSource}>— {renderText(block.source)}</span>
        </blockquote>
      )
    }
    if (block.type === 'table') {
      return (
        <table key={i} className={shared.table}>
          {block.caption && <caption className={shared.tableCaption}>{renderText(block.caption)}</caption>}
          <thead>
            <tr>
              {block.columns.map((c, ci) => (
                <th key={ci} scope="col" className={shared.tableHeader}>{renderText(c)}</th>
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
    if (block.type === 'image') {
      return (
        <div key={i} className={shared.inlineMedia}>
          <ImagePanel
            src={block.src}
            alt={block.alt}
            caption={block.caption}
            aspect={block.aspect}
            placeholderLabel={block.placeholderLabel}
          />
        </div>
      )
    }
    if (block.type === 'audio') {
      return (
        <figure key={i} className={shared.inlineMedia}>
          <audio className={shared.audio} controls preload="none" src={block.src} />
          {block.caption && <figcaption className={shared.mediaCaption}>{block.caption}</figcaption>}
        </figure>
      )
    }
    if (block.type === 'video') {
      return (
        <figure key={i} className={shared.inlineMedia}>
          <video className={shared.video} controls preload="none" src={block.src} poster={block.poster} />
          {block.caption && <figcaption className={shared.mediaCaption}>{block.caption}</figcaption>}
        </figure>
      )
    }
    return <p key={i}>{renderText(block.text)}</p>
  })
}
