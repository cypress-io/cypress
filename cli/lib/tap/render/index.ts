import type { ClearResult, PinResult, TapCommandName, TapCommandOptionSchema, TapCommandResult, TapNativeCommandName, TapReporterSpecView, TapReporterView } from '@packages/cypress-instances'
import type { TapRunResult } from '../commands/run'
import type { TapInstanceSummary } from '../commands/instances'
import type { TapSpecEntry } from '../commands/specs'
import type { TapStatus } from '../types'
import type { FrameDomResult } from '../commands/dom'
import type { FrameAriaResult } from '../commands/aria'
import type { FrameInspectResult } from '../commands/inspect'
import { renderReporterHuman, renderReporterSpecHuman } from './reporter'
import { renderRunHuman } from './run'
import { renderInstancesHuman } from './instances'
import { renderSpecsHuman } from './specs'
import { renderStatusHuman } from './status'
import { renderDomHuman } from './dom'
import { renderAriaHuman } from './aria'
import { renderInspectHuman } from './inspect'
import { renderPinHuman } from './pin'
import { renderCommandHuman } from './command'
import { consolePropsOptions } from './console-props'

/**
 * The CLI-side rendering half of a tap command's definition. A command that
 * declares `renderHuman` prints that rendering by default; `--json` bypasses it
 * for the raw result. Commands without one keep printing JSON. The result shape
 * a renderer receives is the command's typed interface from the shared
 * `@packages/cypress-instances` contract; `options` are the command's invoked
 * options, for a command whose result shape depends on them. Returning
 * undefined declines the rendering for the invoked options, printing the raw
 * JSON as if `--json` had been passed.
 *
 * `options` here are the view's own: flags the CLI declares on top of the
 * command's schema, parsed and rendered into its help like any other but never
 * forwarded to the instance, since they only shape how the result reads.
 */
export interface TapCommandRendering {
  renderHuman: (result: unknown, options: Record<string, string>) => string | undefined
  options?: readonly TapCommandOptionSchema[]
}

const renderings: Partial<Record<TapCommandName | TapNativeCommandName, TapCommandRendering>> = {
  reporter: {
    renderHuman: (result) => {
      // Only the no-test spec overview carries `stats`; the single-test view never does.
      const view = result as TapReporterView | TapReporterSpecView

      return 'stats' in view ? renderReporterSpecHuman(view) : renderReporterHuman(view)
    },
  },
  command: {
    options: consolePropsOptions,
    renderHuman: (result, options) => {
      // --full-report asks for every value however long, which is a payload to
      // pipe into a tool rather than to read: print it as the JSON it is.
      if (options['full-report'] === 'true') {
        return undefined
      }

      return renderCommandHuman(result as TapCommandResult, { depth: options.depth, path: options.path })
    },
  },
  run: { renderHuman: (result) => renderRunHuman(result as TapRunResult) },
  instances: { renderHuman: (result) => renderInstancesHuman(result as TapInstanceSummary[]) },
  specs: { renderHuman: (result) => renderSpecsHuman(result as TapSpecEntry[]) },
  status: { renderHuman: (result) => renderStatusHuman(result as TapStatus) },
  dom: { renderHuman: (result) => renderDomHuman(result as FrameDomResult) },
  aria: { renderHuman: (result) => renderAriaHuman(result as FrameAriaResult) },
  inspect: { renderHuman: (result) => renderInspectHuman(result as FrameInspectResult) },
  pin: { renderHuman: (result) => renderPinHuman(result as PinResult | ClearResult) },
}

export const renderingFor = (command: string): TapCommandRendering | undefined => {
  return renderings[command as TapCommandName | TapNativeCommandName]
}

/**
 * The view-only options to declare on a command on top of the ones its schema
 * advertises. They stay in the CLI: the instance neither needs nor is told about
 * them, so they work against any version that has the command at all.
 */
export const renderOptionsFor = (command: string): readonly TapCommandOptionSchema[] => {
  return renderingFor(command)?.options ?? []
}
