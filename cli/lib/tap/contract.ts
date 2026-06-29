/**
 * The frozen handshake surface for `window.__CYPRESS_TAP_BINDING__`, mirrored
 * type-only from `@packages/app`'s `src/runner/tap/contract.ts`.
 *
 * This is ALL the CLI hardcodes about the binding: the global name, the two
 * methods (`getSchema` and `exec`), and the shapes they return. Commands are
 * discovered at runtime from the schema, and arguments are forwarded to `exec`
 * as raw strings — validation and type coercion happen app-side, so any CLI
 * version can drive any Cypress version as long as both agree on the protocol
 * version below.
 *
 * Every value MUST round-trip through JSON cleanly: the CLI invokes binding
 * methods over CDP `Runtime.callFunctionOn` with `returnByValue: true` +
 * `awaitPromise: true`. Failures are returned values, never thrown — a thrown
 * error is treated as a binding bug.
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
 * One option (flag) a command accepts. A `boolean` option is a valueless flag
 * (present ⇒ true); `string`/`number` options take a value. Like positionals,
 * values are forwarded to `exec` as raw strings and coerced app-side.
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
 * failures only (unknown command, args that do not satisfy the schema); domain
 * failures are values inside `ok: true` results, shaped by each command.
 */
export type TapExecResult =
  | { ok: true, result: unknown }
  | { ok: false, code: string, message: string }
