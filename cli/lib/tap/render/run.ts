import type { TapRunResult } from '../commands/run'
import { color, definitionList, layout, titleLine } from './format'

// The run command starts a spec and returns immediately (poll `status` for
// progress), so this confirms what was launched rather than reporting an outcome.
export const renderRunHuman = (result: TapRunResult): string => {
  return layout([
    [titleLine(color.pass('▶'), result.spec)],
    definitionList([
      ['testing type', result.testingType],
      ['browser', result.browser],
    ]),
  ])
}
