import type { TapCommandEntry, TapCommandName, TapCommandOptionSchema, TapConsoleProps, TapNativeCommandName, TapReporterSpecView, TapReporterView } from '@packages/cypress-instances'
import { renderReporterHuman, renderReporterSpecHuman } from './reporter'
import { renderCommandEntryHuman } from './command'
import { consolePropsOptions, renderConsolePropsHuman } from './console-props'

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
    // A console-props payload is arbitrary JSON and can carry the same keys a log
    // entry does, so the flag that chose the shape decides the rendering rather
    // than the shape itself.
    renderHuman: (result, options) => {
      if (options.props !== 'true') {
        return renderCommandEntryHuman(result as TapCommandEntry)
      }

      // --full-report asks for every value however long, which is a payload to
      // pipe into a tool rather than to read: print it as the JSON it is.
      if (options['full-report'] === 'true') {
        return undefined
      }

      return renderConsolePropsHuman(result as TapConsoleProps, { depth: options.depth, path: options.path })
    },
  },
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
