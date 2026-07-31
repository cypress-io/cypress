import chalk from 'chalk'

import type { FrameInspectResult } from '../commands/inspect'
import { color, definitionList, heading, layout } from './format'

const urlSuffix = (url?: string): string => (url ? `  ${color.muted(url)}` : '')

// A record renders as a counted heading over an aligned key/value list; an empty
// or absent record contributes no block.
const recordBlock = (title: string, record?: Record<string, string>): string[][] => {
  const entries = Object.entries(record ?? {})

  return entries.length ? [[heading(title, entries.length), ...definitionList(entries)]] : []
}

const ariaBlock = (aria: FrameInspectResult['aria']): string[][] => {
  const rows: Array<[string, string | undefined]> = [
    ['role', aria?.role],
    ['name', aria?.name],
    ['states', aria?.states?.length ? aria.states.join(', ') : undefined],
  ]

  const entries = rows.filter((row): row is [string, string] => row[1] !== undefined)

  return entries.length ? [[heading('ACCESSIBILITY'), ...definitionList(entries)]] : []
}

const boxBlock = (box: FrameInspectResult['box']): string[][] => {
  return box ? [[heading('BOX'), `  x ${box.x}   y ${box.y}   width ${box.width}   height ${box.height}`]] : []
}

export const renderInspectHuman = (result: FrameInspectResult): string => {
  if (!result.found) {
    return `${chalk.bold(result.selector)}  ${color.muted('not found')}${urlSuffix(result.url)}`
  }

  return layout([
    [`${chalk.bold(result.tag ?? '?')}  ${result.selector}${urlSuffix(result.url)}`],
    ...recordBlock('ATTRIBUTES', result.attributes),
    ...ariaBlock(result.aria),
    ...boxBlock(result.box),
    ...recordBlock('STYLES', result.styles),
  ])
}
