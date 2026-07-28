import type { TapCommandName, TapReporterView } from '@packages/cypress-instances'
import { renderReporterHuman } from './reporter'

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
  reporter: { renderHuman: (result) => renderReporterHuman(result as TapReporterView) },
}

export const renderingFor = (command: string): TapCommandRendering | undefined => {
  return renderings[command as TapCommandName]
}
