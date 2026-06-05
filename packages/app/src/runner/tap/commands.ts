import type { HealthResult, TapCommandParamSchema } from './contract'

/**
 * One `cypress tap` subcommand: the metadata `getSchema()` advertises to the
 * CLI plus the handler `exec` dispatches to. Handlers receive args already
 * validated and coerced against `params`, and must take/return only
 * JSON-serializable values per `./contract`.
 */
export interface TapCommandDefinition {
  description: string
  params: TapCommandParamSchema[]
  handler: (...args: any[]) => Promise<unknown>
}

/**
 * The command registry — the single source of truth for the tap binding.
 * `getSchema()` serializes the metadata and `TapManager.exec` dispatches by
 * name, so adding an entry here is the whole job of adding a subcommand.
 */
export const tapCommands = {
  health: {
    description: 'check that a running Cypress instance is reachable and its tap binding responds',
    params: [],
    handler: async (): Promise<HealthResult> => 'ok',
  },
} satisfies Record<string, TapCommandDefinition>
