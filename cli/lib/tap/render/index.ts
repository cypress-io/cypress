import type { ClearResult, PinResult, TapCommandName, TapCommandOptionSchema, TapCommandResult, TapNativeCommandName, TapReporterSpecView, TapReporterView } from '@packages/cypress-instances'
import { TAP_VIEW_OPTIONS } from '@packages/cypress-instances'
import type { TapRunResult } from '../commands/run'
import type { TapInstanceSummary } from '../commands/instances'
import type { TapSpecEntry } from '../commands/specs'
import type { TapStatus } from '../types'
import type { FrameDomResult } from '../commands/dom'
import type { FrameAriaResult } from '../commands/aria'
import type { FrameInspectResult } from '../commands/inspect'
import type { FrameAmbiguousResult } from '../aut/single-match'
import { renderAmbiguousHuman } from './ambiguous'
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

/**
 * The CLI-side rendering half of a tap command's definition. A command that
 * declares `renderHuman` prints that rendering by default; `--json` bypasses it
 * for the raw result. Commands without one keep printing JSON. The result shape
 * a renderer receives is the command's typed interface from the shared
 * `@packages/cypress-instances` contract; `options` are the command's invoked
 * options, for a command whose result shape depends on them. Returning
 * undefined declines the rendering for the invoked options, printing the raw
 * JSON as if `--json` had been passed.
 */
export interface TapCommandRendering {
  renderHuman: (result: unknown, options: Record<string, string>) => string | undefined
}

// The selector-taking AUT reads answer an ambiguous selector in place of the
// read they were asked for, so each one renders that answer instead of its own.
const orAmbiguous = <T>(render: (result: T) => string) => {
  return (result: unknown): string => {
    const ambiguous = result as FrameAmbiguousResult

    return ambiguous.ambiguous ? renderAmbiguousHuman(ambiguous) : render(result as T)
  }
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
    renderHuman: (result, options) => {
      return renderCommandHuman(result as TapCommandResult, {
        depth: options.depth,
      })
    },
  },
  run: { renderHuman: (result) => renderRunHuman(result as TapRunResult) },
  instances: { renderHuman: (result) => renderInstancesHuman(result as TapInstanceSummary[]) },
  specs: { renderHuman: (result) => renderSpecsHuman(result as TapSpecEntry[]) },
  status: { renderHuman: (result) => renderStatusHuman(result as TapStatus) },
  dom: { renderHuman: orAmbiguous<FrameDomResult>(renderDomHuman) },
  aria: { renderHuman: orAmbiguous<FrameAriaResult>(renderAriaHuman) },
  inspect: { renderHuman: orAmbiguous<FrameInspectResult>(renderInspectHuman) },
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
  return TAP_VIEW_OPTIONS[command as TapCommandName | TapNativeCommandName] ?? []
}
