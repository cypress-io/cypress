import chalk from 'chalk'

import type { TapInstanceSummary } from '../commands/instances'
import { color, columns, layout, panel } from './format'

/** The facts an instance row shows — carried by a summary, and by a status. */
export interface InstanceRow {
  pid: number
  projectRoot: string
  testingType: 'e2e' | 'component' | null
  browserName: string | null
  browserAttached?: boolean
  browserSupported?: boolean
  rendererResponsive?: boolean
}

// An open browser reads by its name alone only when tap can actually drive it;
// each way that can fail — a browser tap does not support, one it has lost its
// connection to, one whose page will not answer — is the state every other
// command fails in, so each says which.
const browserState = (instance: InstanceRow): string | null => {
  if (instance.browserSupported === false) {
    return 'unsupported'
  }

  if (instance.browserAttached === false) {
    return 'not attached'
  }

  return instance.rendererResponsive === false ? 'not responding' : null
}

const browserCell = (instance: InstanceRow): string => {
  if (instance.browserName === null) {
    return '—'
  }

  const state = browserState(instance)

  return state === null ? instance.browserName : `${instance.browserName} (${state})`
}

const browserColor = (instance: InstanceRow) => {
  if (instance.browserName === null) {
    return color.muted
  }

  const state = browserState(instance)

  if (state === null) {
    return color.pass
  }

  return state === 'unsupported' ? color.warn : color.aborted
}

// One row per instance. PID is bold — it's the handle the other tap commands
// accept via `--instance` — and an attached browser reads green by its name, an
// absent one (or testing type) as a muted dash.
export const instanceColumns = (instances: InstanceRow[]): string[] => {
  const rows = instances.map((instance) => [
    String(instance.pid),
    instance.projectRoot,
    instance.testingType ?? '—',
    browserCell(instance),
  ])

  return columns(['PID', 'PROJECT', 'TYPE', 'BROWSER'], rows, (cells, index) => [
    chalk.bold(cells[0]),
    cells[1],
    cells[2],
    browserColor(instances[index])(cells[3]),
  ])
}

// The reachable open-mode instances under a counted heading.
export const renderInstancesHuman = (instances: TapInstanceSummary[]): string => {
  return layout([panel('INSTANCES', instances.length, instanceColumns(instances))])
}
