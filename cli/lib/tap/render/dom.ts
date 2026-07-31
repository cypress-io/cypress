import type { FrameDomResult } from '../commands/dom'
import { color, emptyState, heading, layout } from './format'

// The frame URL trails the panel title in muted text, the way the reporter dims
// contextual detail.
const urlSuffix = (url?: string): string => (url ? `  ${color.muted(url)}` : '')

// Selector mode prints each match's outerHTML as its own block under a counted
// title; whole-page mode prints the single document. A browser-side clip adds a
// muted trailer either way.
export const renderDomHuman = (result: FrameDomResult): string => {
  const truncation = result.truncated ? [[color.muted('(output truncated)')]] : []

  if (result.matches) {
    if (result.matches.count === 0) {
      return emptyState('No elements matched the selector.')
    }

    return layout([
      [`${heading('MATCHES', result.matches.count)}${urlSuffix(result.url)}`],
      ...result.matches.html.map((html) => [html]),
      ...truncation,
    ])
  }

  return layout([
    [`${heading('DOM')}${urlSuffix(result.url)}`],
    ...(result.html !== undefined ? [[result.html]] : []),
    ...truncation,
  ])
}
