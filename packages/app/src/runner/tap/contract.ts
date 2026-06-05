/**
 * Cross-process contract for `window.__CYPRESS_TAP_BINDING__`.
 *
 * The binding exposes exactly two methods, and they are the only surface the
 * Cypress CLI hardcodes (mirrored type-only in `cli/lib/tap/contract.ts`, the
 * same convention `cli/lib/runner-discovery.ts` uses for
 * `RunnerDiscoveryRecord`):
 *
 * - `getSchema()` — the handshake: advertises every command (name,
 *   description, params) with a protocol version.
 * - `exec(command, args)` — the single dispatch entry point: raw string
 *   positionals are validated and coerced against the registry's param
 *   schema HERE, app-side, so the CLI never interprets param types and any
 *   CLI version can drive any Cypress version.
 *
 * The command registry in `./commands` is the single source of truth: the
 * schema and the dispatch are both derived from it.
 *
 * Every value MUST round-trip through JSON cleanly: CDP
 * `Runtime.callFunctionOn` with `returnByValue: true` + `awaitPromise: true`
 * serializes arguments and return values. Failures are returned values,
 * never thrown — a thrown error is treated by callers as a binding bug.
 */

/**
 * Bump ONLY when the schema shapes themselves change incompatibly — adding
 * commands or params never requires a bump. The CLI rejects schemas whose
 * version it does not understand.
 */
export const TAP_PROTOCOL_VERSION = 1

export interface TapCommandParamSchema {
  name: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  description: string
}

export interface TapCommandSchema {
  /** The CLI subcommand name AND the `exec` command name — one name, no mapping. */
  name: string
  description: string
  params: TapCommandParamSchema[]
}

export interface TapSchema {
  protocolVersion: typeof TAP_PROTOCOL_VERSION
  cypressVersion: string
  commands: TapCommandSchema[]
}

export type TapExecFailureCode = 'UNKNOWN_COMMAND' | 'INVALID_ARGUMENTS'

/**
 * The wire envelope `exec` resolves with. `ok: false` covers dispatch-level
 * failures only — an unrecognized command name or positionals that do not
 * satisfy the command's param schema. Domain failures (a command that ran
 * but could not do what was asked) are values inside `ok: true` results,
 * shaped by each command as a discriminated union.
 */
export type TapExecResult =
  | { ok: true, result: unknown }
  | { ok: false, code: TapExecFailureCode, message: string }

export type HealthResult = 'ok'

/** The full callable surface of the binding. */
export interface TapBindingContract {
  getSchema (): Promise<TapSchema>
  exec (command: string, args?: string[]): Promise<TapExecResult>
}
