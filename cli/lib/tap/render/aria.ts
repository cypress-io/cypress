import chalk from 'chalk'

import type { AriaNodeOut, FrameAriaResult } from '../commands/aria'
import { color, emptyState, heading, indent, layout } from './format'

// One node per line, indented by depth under the panel header: bold role, then
// its accessible name, an `= value` for value-bearing controls, and any notable
// states as a muted bracketed list — the compact role/name tree DevTools shows.
const renderNode = (node: AriaNodeOut): string => {
  const name = node.name ? `  ${node.name}` : ''
  const value = node.value !== undefined ? ` = ${node.value}` : ''
  const states = node.states?.length ? `  ${color.muted(`[${node.states.join(', ')}]`)}` : ''

  return `${indent(node.depth + 1)}${chalk.bold(node.role)}${name}${value}${states}`
}

export const renderAriaHuman = (result: FrameAriaResult): string => {
  if (!result.nodes.length) {
    return emptyState('No accessibility nodes found.')
  }

  const urlSuffix = result.url ? `  ${color.muted(result.url)}` : ''

  const blocks: string[][] = [
    [`${heading('ARIA', result.nodeCount)}${urlSuffix}`, ...result.nodes.map(renderNode)],
  ]

  if (result.truncated) {
    blocks.push([color.muted('(output truncated)')])
  }

  return layout(blocks)
}
