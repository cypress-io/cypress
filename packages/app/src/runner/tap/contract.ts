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
 * - `exec(command, args, options)` — the single dispatch entry point: `args`
 *   and `options` both arrive as raw-string maps keyed by schema name, and are
 *   validated and coerced against the registry's param/option schema HERE,
 *   app-side, so the CLI never interprets types and any CLI version can drive
 *   any Cypress version.
 *
 * The command registry in `./commands` is the single source of truth: the
 * schema and the dispatch are both derived from it. Per-command result
 * shapes are NOT part of this frozen surface — they live with their command
 * in `./commands/<name>.ts` and reach the CLI as opaque JSON.
 *
 * Every value MUST round-trip through JSON cleanly: CDP
 * `Runtime.callFunctionOn` with `returnByValue: true` + `awaitPromise: true`
 * serializes arguments and return values. The binding methods themselves never
 * throw over the wire — both dispatch and domain failures come back as
 * `{ ok: false }` values (see `TapExecResult`); a method that actually throws
 * is treated by callers as a binding bug.
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

/**
 * The reserved codes `exec` itself produces for dispatch-level failures: an
 * unrecognized command name or positionals/options that do not satisfy the
 * command's schema. Domain failures carry a command-defined code instead (via
 * `TapCommandError`), so `code` below is an open `string` — those codes are
 * not part of this frozen surface, the same way per-command result shapes are
 * not.
 */
export type TapExecDispatchFailureCode = 'UNKNOWN_COMMAND' | 'INVALID_ARGUMENTS'

/**
 * The wire envelope `exec` resolves with. `ok: true` carries the command's
 * success payload, shaped by each command. `ok: false` carries a failure:
 * either a dispatch-level failure (a reserved `TapExecDispatchFailureCode`) or
 * a domain failure a command raised (`TapCommandError`, a command-defined
 * code). The CLI renders any `ok: false` on stderr and exits non-zero, so the
 * two are handled the same downstream — only the `code` tells them apart.
 */
export type TapExecResult =
  | { ok: true, result: unknown }
  | { ok: false, code: string, message: string }

/** The full callable surface of the binding. */
export interface TapBindingContract {
  getSchema (): Promise<TapSchema>
  exec (command: string, args?: Record<string, string>, options?: Record<string, string>): Promise<TapExecResult>
}
