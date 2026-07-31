import chalk from 'chalk'

import type { TapInstanceSummary } from '../commands/instances'
import { color, columns, layout, panel } from './format'

/** The facts an instance row shows — carried by a summary, and by a status. */
export interface InstanceRow {
  pid: number
  projectRoot: string
  testingType: 'e2e' | 'component' | null
  browserName: string | null
}

// One row per instance. PID is bold — it's the handle the other tap commands
// accept via `--instance` — and an attached browser reads green by its name, an
// absent one (or testing type) as a muted dash.
export const instanceColumns = (instances: InstanceRow[]): string[] => {
  const rows = instances.map((instance) => [
    String(instance.pid),
    instance.projectRoot,
    instance.testingType ?? '—',
    instance.browserName ?? '—',
  ])

  return columns(['PID', 'PROJECT', 'TYPE', 'BROWSER'], rows, (cells, index) => [
    chalk.bold(cells[0]),
    cells[1],
    cells[2],
    instances[index].browserName === null ? color.muted(cells[3]) : color.pass(cells[3]),
  ])
}

// The reachable open-mode instances under a counted heading.
export const renderInstancesHuman = (instances: TapInstanceSummary[]): string => {
  return layout([panel('INSTANCES', instances.length, instanceColumns(instances))])
}
