import type { TapRunResult } from '../commands/run'
import { color, layout, titleLine } from './format'

// The run command requests a spec and returns immediately (poll `status` for
// progress), so this acknowledges the request rather than reporting an outcome.
export const renderRunHuman = (result: TapRunResult): string => {
  return layout([
    [titleLine(color.pending('●'), `${result.spec} is ${result.status}`)],
    [color.muted('use tap status to check progress')],
  ])
}
