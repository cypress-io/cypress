import type { FrameDomResult } from '../commands/dom'
import { color, emptyState, layout } from './format'

/**
 * `outerHTML` starts at the element but its inner lines keep the indentation
 * they had in the document, so a deeply nested element arrives ragged — first
 * line at the margin, the rest pushed right. Removing the smallest indent they
 * all share pulls the markup back to the margin without touching its internal
 * shape. Rendering-only: `--json` keeps the document's own whitespace.
 */
const dedent = (html: string): string => {
  const [first, ...rest] = html.split('\n')
  const shared = rest
  .filter((line) => line.trim().length)
  .reduce((min, line) => Math.min(min, line.length - line.trimStart().length), Infinity)

  if (!rest.length || shared === Infinity || shared === 0) {
    return html
  }

  return [first, ...rest.map((line) => line.slice(shared))].join('\n')
}

// Nothing but the HTML — no title framing it, so the output reads (and pipes)
// as the markup it is. A browser-side clip still adds a muted trailer, since
// silently handing back half a document would be worse than a little furniture.
export const renderDomHuman = (result: FrameDomResult): string => {
  if (result.found === false) {
    return emptyState('No element matched the selector.')
  }

  return layout([
    ...(result.html !== undefined ? [[dedent(result.html)]] : []),
    ...(result.truncated ? [[color.muted('(output truncated)')]] : []),
  ])
}
