import chalk from 'chalk'

import type { PinnedRef, TapStatus } from '../types'
import { color, countsLine, definitionList, layout, stateBadge } from './format'

// The lifecycle phase's dot and tint: a filled green/red check for a finished
// run, indigo while running, a muted ring for the pre-run "coming up" stages.
const PHASE = {
  passed: { icon: stateBadge.passed.icon, tint: color.pass },
  failed: { icon: stateBadge.failed.icon, tint: color.fail },
  running: { icon: color.pending('●'), tint: color.pending },
} as const

const phaseOf = (status: string) => PHASE[status as keyof typeof PHASE] ?? { icon: color.muted('●'), tint: color.muted }

// The pinned command plus the test it belongs to (per-attempt ids restart, so
// the test locator disambiguates it).
const pinnedValue = (pinned: PinnedRef): string => {
  const test = pinned.at.name ? `test ${pinned.at.index} "${pinned.at.name}"` : `test ${pinned.at.index}`

  return `${pinned.command}  ${chalk.dim(test)}`
}

export const renderStatusHuman = (status: TapStatus): string => {
  const { icon, tint } = phaseOf(status.status)
  const header = `${icon} ${tint(status.status)}${status.spec ? `  ${chalk.bold(status.spec)}` : ''}`

  const rows: Array<[string, string | undefined]> = [
    ['pid', status.pid?.toString()],
    ['project', status.projectRoot],
    ['testing type', status.testingType === undefined ? undefined : (status.testingType ?? '—')],
    ['specs', status.totalSpecs?.toString()],
    ['tests', status.totalTests?.toString()],
  ]

  const entries = rows.filter((row): row is [string, string] => row[1] !== undefined)

  const blocks: string[][] = [[header]]

  if (entries.length) {
    blocks.push(definitionList(entries))
  }

  if (status.results) {
    blocks.push([`  ${countsLine(status.results)}`])
  }

  if (status.pinned) {
    blocks.push(definitionList([['pinned', pinnedValue(status.pinned)]]))
  }

  return layout(blocks)
}
