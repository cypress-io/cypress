import type { TapCommandName, TapNativeCommandName, TapReporterSpecView, TapReporterView } from '@packages/cypress-instances'
import type { TapRunResult } from '../commands/run'
import type { TapInstanceSummary } from '../commands/instances'
import { renderReporterHuman, renderReporterSpecHuman } from './reporter'
import { renderRunHuman } from './run'
import { renderInstancesHuman } from './instances'

/**
 * The CLI-side rendering half of a tap command's definition. A command that
 * declares `renderHuman` prints that rendering by default; `--json` bypasses it
 * for the raw result. Commands without one keep printing JSON. The result shape
 * a renderer receives is the command's typed interface from the shared
 * `@packages/cypress-instances` contract.
 */
export interface TapCommandRendering {
  renderHuman: (result: unknown) => string
}

const renderings: Partial<Record<TapCommandName | TapNativeCommandName, TapCommandRendering>> = {
  reporter: {
    renderHuman: (result) => {
      // Only the no-test spec overview carries `stats`; the single-test view never does.
      const view = result as TapReporterView | TapReporterSpecView

      return 'stats' in view ? renderReporterSpecHuman(view) : renderReporterHuman(view)
    },
  },
  run: { renderHuman: (result) => renderRunHuman(result as TapRunResult) },
  instances: { renderHuman: (result) => renderInstancesHuman(result as TapInstanceSummary[]) },
}

export const renderingFor = (command: string): TapCommandRendering | undefined => {
  return renderings[command as TapCommandName | TapNativeCommandName]
}
