import type { TapCommandName, TapReporterSpecView, TapReporterView } from '@packages/cypress-instances'
import { renderReporterHuman, renderReporterSpecHuman } from './reporter'

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

const renderings: Partial<Record<TapCommandName, TapCommandRendering>> = {
  reporter: {
    renderHuman: (result) => {
      // Only the no-test spec overview carries `stats`; the single-test view never does.
      const view = result as TapReporterView | TapReporterSpecView

      return 'stats' in view ? renderReporterSpecHuman(view) : renderReporterHuman(view)
    },
  },
}

export const renderingFor = (command: string): TapCommandRendering | undefined => {
  return renderings[command as TapCommandName]
}
