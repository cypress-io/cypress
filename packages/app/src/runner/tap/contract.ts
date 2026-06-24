/**
 * Cross-process contract for `window.__CYPRESS_TAP_BINDING__`.
 *
 * The binding exposes exactly two methods, and they are the only surface the
 * Cypress CLI hardcodes (mirrored type-only in `cli/lib/tap/contract.ts`, the
 * same convention `cli/lib/runner-instances.ts` uses for
 * `RunnerInstance`):
 *
 * - `getSchema()` — the handshake: advertises every command (name,
 *   description, params) with a protocol version.
 * - `exec(command, args, options)` — the single dispatch entry point: `args`
 *   and `options` both arrive as raw-string maps keyed by schema name, and are
 *   validated and coerced against the registry's param/option schema HERE,
 *   app-side, so the CLI never interprets types and any CLI version can drive
 *   any Cypress version.
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

/**
 * One option (flag) a command accepts: `--name`, optionally with a single
 * character `-a` alias. A `boolean` option is a valueless flag (present ⇒
 * true); `string`/`number` options take a value. Like params, the CLI
 * forwards option values as raw strings and the coercion to this type happens
 * here, app-side, so a new option type never strands an older CLI. The `name`
 * is a single token (no dashes), so it survives the wire as-is.
 */
export interface TapCommandOptionSchema {
  name: string
  alias?: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  description: string
}

interface TapCommandSchema {
  /** The CLI subcommand name AND the `exec` command name — one name, no mapping. */
  name: string
  description: string
  params: readonly TapCommandParamSchema[]
  options: readonly TapCommandOptionSchema[]
}

export interface TapSchema {
  protocolVersion: typeof TAP_PROTOCOL_VERSION
  cypressVersion: string
  commands: TapCommandSchema[]
}

type TapExecFailureCode = 'UNKNOWN_COMMAND' | 'INVALID_ARGUMENTS'

/**
 * The wire envelope `exec` resolves with. `ok: false` covers dispatch-level
 * failures only — an unrecognized command name or args that do not satisfy the
 * command's param schema. Domain failures (a command that ran
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
  exec (command: string, args?: Record<string, string>, options?: Record<string, string>): Promise<TapExecResult>
}
