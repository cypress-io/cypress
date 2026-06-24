import { tapCommands } from './commands'
import { TapCommandError } from './commands/definition'
import type { TapCommandDefinition } from './commands/definition'
import { coerceCommandArgs, coerceCommandOptions } from './exec-args'
import { TAP_SCHEMA_VERSION } from './contract'
import type { TapBindingContract, TapExecResult, TapSchema } from './contract'

// A wire payload for args/options must be absent or a plain object keyed by
// name. Default params only fill in `undefined`, so a CDP caller can still hand
// us `null` (treated as absent) or a primitive/array — the latter would slip
// past `Object.keys` with no keys and silently validate. Return null to signal
// a malformed payload so exec can reject it and still resolve to an envelope.
const normalizePayload = (value: unknown): Record<string, string> | null => {
  if (value == null) {
    return {}
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, string>
}

/**
 * The callable surface mounted at `window.__CYPRESS_TAP_BINDING__`. External
 * callers (the Cypress CLI) invoke the two contract methods over CDP via a
 * constant `Runtime.callFunctionOn` trampoline, so both must be async,
 * reachable via `this`, and must take/return only JSON-serializable values
 * per `./contract`.
 */
export class TapManager implements TapBindingContract {
  constructor (private cypressVersion: string) {}

  async getSchema (): Promise<TapSchema> {
    return {
      schemaVersion: TAP_SCHEMA_VERSION,
      cypressVersion: this.cypressVersion,
      commands: Object.entries(tapCommands).map(([name, definition]) => {
        // `satisfies` keeps each entry's narrow literal type, so a command that
        // omits the optional `options` has no such property to destructure;
        // widen to the definition shape to read it (defaulting to none).
        const { description, params, options } = definition as TapCommandDefinition

        return {
          name,
          description,
          params: params.map((param) => ({ ...param })),
          options: (options ?? []).map((option) => ({ ...option })),
        }
      }),
    }
  }

  /**
   * The single dispatch entry point. `command`, `args`, and `options` arrive
   * from the wire as raw strings — `args` and `options` are both maps keyed by
   * schema name; both are validated and coerced against the registry's
   * param/option schema before the handler runs. The handler receives the
   * coerced params object followed by the coerced options object. Both dispatch
   * failures and domain failures (a handler's `TapCommandError`) come back as
   * `{ error }`; the handler's own return value is the `{ result }` payload. Any
   * other throw is a binding bug and propagates to the caller.
   */
  async exec (command: string, args: Record<string, string> = {}, options: Record<string, string> = {}): Promise<TapExecResult> {
    // Own-property lookup: `command` is wire input, so an inherited name
    // like "constructor" must not resolve to a prototype member.
    const definition: TapCommandDefinition | undefined = Object.prototype.hasOwnProperty.call(tapCommands, command)
      ? tapCommands[command]
      : undefined

    if (!definition) {
      return {
        error: {
          code: 'UNKNOWN_COMMAND',
          message: `"${command}" is not a command of this Cypress (v${this.cypressVersion}). Available commands: ${Object.keys(tapCommands).join(', ')}.`,
        },
      }
    }

    const normalizedArgs = normalizePayload(args)
    const normalizedOptions = normalizePayload(options)

    if (!normalizedArgs || !normalizedOptions) {
      const field = normalizedArgs ? 'options' : 'args'

      return {
        error: {
          code: 'INVALID_PAYLOAD',
          message: `"${command}" received a non-object ${field} payload; expected an object keyed by name.`,
        },
      }
    }

    const optionSchema = definition.options ?? []

    const coercedArgs = coerceCommandArgs(command, definition.params, normalizedArgs, optionSchema)

    if (!coercedArgs.ok) {
      return { error: { code: 'INVALID_ARGUMENTS', message: coercedArgs.message } }
    }

    const coercedOptions = coerceCommandOptions(command, definition.params, optionSchema, normalizedOptions)

    if (!coercedOptions.ok) {
      return { error: { code: 'INVALID_OPTIONS', message: coercedOptions.message } }
    }

    try {
      return { result: await definition.handler(coercedArgs.args, coercedOptions.options) }
    } catch (err) {
      // A handler signals a domain failure (no run yet, no such test/spec) by
      // throwing TapCommandError; surface it as an { error } envelope so the CLI
      // renders it on stderr and exits non-zero. Any other throw is a real
      // binding bug.
      if (err instanceof TapCommandError) {
        return { error: { code: err.code, message: err.message } }
      }

      throw err
    }
  }
}
