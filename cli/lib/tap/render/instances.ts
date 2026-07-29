import chalk from 'chalk'

import type { TapInstanceSummary } from '../commands/instances'
import { color, layout, table } from './format'

// The reachable open-mode instances, one row each. PID is bold — it's the handle
// the other tap commands accept via `--instance` — and an attached browser reads
// green, an absent one (or testing type) as a muted dash.
export const renderInstancesHuman = (instances: TapInstanceSummary[]): string => {
  const rows = instances.map((instance) => [
    String(instance.pid),
    instance.projectRoot,
    instance.testingType ?? '—',
    instance.browserAttached ? 'attached' : '—',
  ])

  return layout([
    table('INSTANCES', ['PID', 'PROJECT', 'TYPE', 'BROWSER'], rows, (cells) => [
      chalk.bold(cells[0]),
      cells[1],
      cells[2],
      cells[3].startsWith('attached') ? color.pass(cells[3]) : color.muted(cells[3]),
    ]),
  ])
}
