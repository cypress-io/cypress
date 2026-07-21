import { tapCommands } from './commands'
import { TapCommandError } from './commands/definition'
import type { TapCommandDefinition } from './commands/definition'
import { coerceCommandArgs, coerceCommandOptions } from './exec-args'
import { TAP_SCHEMA_VERSION } from './contract'
import type { TapBindingContract, TapExecResult, TapSchema } from './contract'

// Normalize a wire payload to a plain object, or null if malformed. `null` maps
// to `{}` (absent); a primitive or array would otherwise slip past `Object.keys`
// with no keys and validate silently, so reject it as null.
const normalizePayload = (value: unknown): Record<string, string> | null => {
  if (value == null) {
    return {}
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, string>
}

// The surface mounted at `window.__CYPRESS_TAP_BINDING__`, invoked by the CLI
// over CDP `Runtime.callFunctionOn` — both methods are async and JSON-only per `./contract`.
export class TapManager implements TapBindingContract {
  constructor (private cypressVersion: string) {}

  async getSchema (): Promise<TapSchema> {
    return {
      schemaVersion: TAP_SCHEMA_VERSION,
      cypressVersion: this.cypressVersion,
      commands: Object.entries(tapCommands).map(([name, definition]) => {
        // Widen past the `satisfies` literal type so the optional `options` is readable.
        const { description, params, options, hidden } = definition as TapCommandDefinition

        return {
          name,
          description,
          params: params.map((param) => ({ ...param })),
          options: (options ?? []).map((option) => ({ ...option })),
          ...(hidden ? { hidden: true } : {}),
        }
      }),
    }
  }

  // The single dispatch entry point. `args`/`options` arrive as raw-string maps
  // keyed by schema name, are coerced here, then passed to the handler. Dispatch
  // and domain failures both resolve as `{ error }`; any other throw propagates.
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
      // A handler's TapCommandError is a domain failure; surface it as { error }.
      // Any other throw is a real binding bug.
      if (err instanceof TapCommandError) {
        return { error: { code: err.code, message: err.message } }
      }

      throw err
    }
  }
}
