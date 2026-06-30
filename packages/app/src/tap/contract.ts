/**
 * Cross-process contract for `window.__CYPRESS_TAP_BINDING__`, the only surface
 * the CLI hardcodes (mirrored type-only in `cli/lib/tap/contract.ts`). Two
 * methods: `getSchema()` advertises the commands, `exec()` dispatches one. Both
 * are driven over CDP `Runtime.callFunctionOn` (returnByValue + awaitPromise),
 * so every value MUST round-trip through JSON. The `./commands` registry is the
 * source of truth; coercion happens app-side so any CLI version can drive any
 * Cypress version. The methods never throw over the wire — failures come back as
 * `{ error }` (see `TapExecResult`); an actual throw is a binding bug.
 */

// Internal negotiation signal; the CLI rejects a schema version it does not
// understand. Bump ONLY on incompatible schema-shape changes; adding commands or
// params never requires a bump. Kept out of the public `cli/types` surface.
export const TAP_SCHEMA_VERSION = 1

export interface TapCommandParamSchema {
  name: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  description: string
}

// One option a command accepts: `--name` with an optional `-a` alias. A
// `boolean` is a valueless flag (present ⇒ true); `string`/`number` take a value.
export interface TapCommandOptionSchema {
  name: string
  alias?: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  description: string
}

interface TapCommandSchema {
  // The CLI subcommand name AND the `exec` command name — one name, no mapping.
  name: string
  description: string
  params: readonly TapCommandParamSchema[]
  options: readonly TapCommandOptionSchema[]
}

export interface TapSchema {
  schemaVersion: typeof TAP_SCHEMA_VERSION
  cypressVersion: string
  commands: TapCommandSchema[]
}

// Reserved codes `exec` produces for dispatch-level failures. Domain failures
// carry a command-defined code (via `TapCommandError`), hence the open `string`
// on `TapExecResult` below — those codes are not part of the frozen surface.
export type TapExecDispatchFailureCode = 'UNKNOWN_COMMAND' | 'INVALID_PAYLOAD' | 'INVALID_ARGUMENTS' | 'INVALID_OPTIONS'

// The wire envelope `exec` resolves with. Any `{ error }` (dispatch or domain
// failure) is rendered on stderr and exits non-zero; only `code` tells them apart.
export type TapExecResult =
  | { result: unknown }
  | { error: { code: string, message: string } }

export interface TapBindingContract {
  getSchema (): Promise<TapSchema>
  exec (command: string, args?: Record<string, string>, options?: Record<string, string>): Promise<TapExecResult>
}
