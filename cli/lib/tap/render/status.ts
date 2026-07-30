import type { TapStatus } from '../types'
import { color, countsLine, layout, stateBadge, titleLine } from './format'
import { instanceColumns } from './instances'
import { pinnedBlock } from './pinned'

// The lifecycle phase's dot and tint: a filled green/red check for a finished
// run, indigo while running, a muted ring for the pre-run "coming up" stages.
const PHASE = {
  passed: { icon: stateBadge.passed.icon, tint: color.pass },
  failed: { icon: stateBadge.failed.icon, tint: color.fail },
  running: { icon: color.pending('●'), tint: color.pending },
} as const

const phaseOf = (status: string) => PHASE[status as keyof typeof PHASE] ?? { icon: color.muted('●'), tint: color.muted }

// Where the instance is: the selected spec led by its phase icon, or — before a
// spec is selected — the phase on its own.
const phaseLine = (status: TapStatus): string => {
  const { icon, tint } = phaseOf(status.status)

  return status.spec ? titleLine(icon, status.spec, tint(status.status)) : `${icon} ${tint(status.status)}`
}

export const renderStatusHuman = (status: TapStatus): string => {
  const { pid, projectRoot } = status

  // Nothing to target — the phase is the whole answer.
  if (pid === undefined || projectRoot === undefined) {
    return phaseLine(status)
  }

  const instance = {
    pid,
    projectRoot,
    testingType: status.testingType ?? null,
    browserName: status.browserName ?? null,
  }

  const progress = [phaseLine(status)]

  if (status.results) {
    progress.push(countsLine(status.results))
  }

  const blocks = [instanceColumns([instance]), progress]

  if (status.pinned) {
    blocks.push(pinnedBlock(status.pinned))
  }

  return layout(blocks)
}
