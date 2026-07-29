import { TAP_COMMANDS } from '../contract'
import type { TapCoercedOptions, TapCoercedParams, TapCommandName, TapCommandOptionSchema, TapCommandParamSchema } from '../contract'

/**
 * Thrown by a handler to report a domain failure (no run mounted, no such test
 * or spec). `exec` turns it into an `{ error: { code, message } }` envelope; any
 * other throw escapes as a binding bug. `code` is command-defined, not part of
 * the frozen contract.
 */
export class TapCommandError extends Error {
  code: string

  constructor (code: string, message: string) {
    super(message)
    this.name = 'TapCommandError'
    this.code = code
  }
}

type CommandByName<N extends TapCommandName> = Extract<typeof TAP_COMMANDS[number], { name: N }>

/**
 * Authoring helper for one `cypress tap` subcommand. The command's schema (its
 * params/options metadata) lives in the shared `TAP_COMMANDS` contract so the CLI
 * can list it without an instance attached; this pairs that metadata with the
 * app-side handler and types the handler against the named entry — no annotations,
 * `handler: async ({ spec }, { headed }) => …`. Everything a handler takes or
 * returns must be JSON-serializable per `../contract`.
 */
export const defineCommand = <N extends TapCommandName>(
  name: N,
  handler: (
    params: TapCoercedParams<CommandByName<N>['params']>,
    options: TapCoercedOptions<CommandByName<N>['options']>,
  ) => Promise<unknown>,
): TapCommandDefinition & { name: N } => {
  const meta = TAP_COMMANDS.find((command) => command.name === name)!

  return { ...meta, name, handler }
}

// The erased view the dispatcher reads through: `defineCommand` types each entry
// precisely for authoring, but `TapManager` looks them up through this opaque shape.
// `name` is recorded so the registry can be keyed by it and the two can't drift.
export interface TapCommandDefinition {
  name: TapCommandName
  description: string
  details?: string
  params: readonly TapCommandParamSchema[]
  options?: readonly TapCommandOptionSchema[]
  hidden?: boolean
  handler: (...args: any[]) => Promise<unknown>
}
