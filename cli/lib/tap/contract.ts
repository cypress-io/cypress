/**
 * The frozen handshake surface for `window.__CYPRESS_TAP_BINDING__`, mirrored
 * type-only from `@packages/app`'s `src/runner/tap/contract.ts` (the same
 * convention `cli/lib/runner-discovery.ts` uses for `RunnerDiscoveryRecord`).
 *
 * This is ALL the CLI hardcodes about the binding: the global name, the two
 * methods (`getSchema` and `exec`), and the shapes they return. Every
 * command — its name, description, parameters, and options — is discovered at
 * runtime from the schema, and both positional arguments and option values
 * are forwarded to `exec` as raw strings keyed by their schema name:
 * validation and type coercion happen app-side against the registry's
 * param/option schema, so the CLI never
 * interprets types and any CLI version can drive any Cypress version; the two
 * only have to agree on the protocol version below.
 *
 * Every value MUST round-trip through JSON cleanly: the CLI invokes binding
 * methods over CDP `Runtime.callFunctionOn` with `returnByValue: true` +
 * `awaitPromise: true`, which serializes arguments and return values.
 * Failures are returned values, never thrown — a thrown error is treated as
 * a binding bug.
 */

/** The runner-window global the binding is mounted on. */
export const TAP_BINDING_GLOBAL = '__CYPRESS_TAP_BINDING__'

/** The schema handshake — one of the two binding methods the CLI hardcodes. */
export const TAP_SCHEMA_METHOD = 'getSchema'

/** The dispatch entry point — the other hardcoded binding method. */
export const TAP_EXEC_METHOD = 'exec'

/**
 * The schema-format version this CLI understands. The binding bumps it ONLY
 * when the shapes below change incompatibly — adding commands or params never
 * requires a bump.
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
 * true); `string`/`number` options take a value. The CLI declares these on
 * the subcommand and forwards the parsed values to `exec` as raw strings —
 * coercion to the declared type happens app-side, exactly as it does for
 * positionals.
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
  protocolVersion: number
  cypressVersion: string
  commands: TapCommandSchema[]
}

/**
 * The wire envelope `exec` resolves with. `ok: false` covers dispatch-level
 * failures only (unknown command, positionals that do not satisfy the param
 * schema) — the CLI unwraps the envelope, so command results stay
 * envelope-free on stdout. Domain failures are values inside `ok: true`
 * results, shaped by each command.
 */
export type TapExecResult =
  | { ok: true, result: unknown }
  | { ok: false, code: string, message: string }
