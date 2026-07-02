import { tapCommands } from './commands'
import type { TapCommandDefinition } from './commands'
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

export class TapManager implements TapBindingContract {
  constructor (private cypressVersion: string) {}

  // Describes this Cypress to the CLI: the protocol version, the Cypress
  // version, and the full command registry (params/options) it can call via
  // exec. The CLI reads this to build its interface and validate input.
  async getSchema (): Promise<TapSchema> {
    return {
      schemaVersion: TAP_SCHEMA_VERSION,
      cypressVersion: this.cypressVersion,
      commands: Object.entries(tapCommands).map(([name, definition]) => {
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

  // Runs a single CLI command. Looks up the command, coerces the raw string
  // args/options into typed values per its schema, then invokes the handler.
  // Always resolves to a TapExecResult: { result } on success, or
  // { error: { code, message } } for an unknown command or invalid input.
  async exec (command: string, args: Record<string, string> = {}, options: Record<string, string> = {}): Promise<TapExecResult> {
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

    return { result: await definition.handler(coercedArgs.args, coercedOptions.options) }
  }
}
