import type { TapCommandName, TapNativeCommandName, TapReporterSpecView, TapReporterView } from '@packages/cypress-instances'
import type { TapRunResult } from '../commands/run'
import type { TapInstanceSummary } from '../commands/instances'
import type { TapSpecEntry } from '../commands/specs'
import type { TapStatus } from '../types'
import type { FrameDomResult } from '../commands/dom'
import type { FrameAriaResult } from '../commands/aria'
import { renderReporterHuman, renderReporterSpecHuman } from './reporter'
import { renderRunHuman } from './run'
import { renderInstancesHuman } from './instances'
import { renderSpecsHuman } from './specs'
import { renderStatusHuman } from './status'
import { renderDomHuman } from './dom'
import { renderAriaHuman } from './aria'

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
  specs: { renderHuman: (result) => renderSpecsHuman(result as TapSpecEntry[]) },
  status: { renderHuman: (result) => renderStatusHuman(result as TapStatus) },
  dom: { renderHuman: (result) => renderDomHuman(result as FrameDomResult) },
  aria: { renderHuman: (result) => renderAriaHuman(result as FrameAriaResult) },
}

export const renderingFor = (command: string): TapCommandRendering | undefined => {
  return renderings[command as TapCommandName | TapNativeCommandName]
}
