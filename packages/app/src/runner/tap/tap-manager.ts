import { tapCommands } from './commands'
import type { TapCommandDefinition } from './commands'
import { coerceCommandArgs, coerceCommandOptions } from './exec-args'
import { TAP_PROTOCOL_VERSION } from './contract'
import type { TapBindingContract, TapExecResult, TapSchema } from './contract'

export class TapManager implements TapBindingContract {
  constructor (private cypressVersion: string) {}

  async getSchema (): Promise<TapSchema> {
    return {
      protocolVersion: TAP_PROTOCOL_VERSION,
      cypressVersion: this.cypressVersion,
      commands: Object.entries(tapCommands).map(([name, definition]) => {
        const { description, params, options } = definition as TapCommandDefinition

        return { name, description, params, options: options ?? [] }
      }),
    }
  }

  async exec (command: string, args: Record<string, string> = {}, options: Record<string, string> = {}): Promise<TapExecResult> {
    const definition: TapCommandDefinition | undefined = Object.prototype.hasOwnProperty.call(tapCommands, command)
      ? tapCommands[command as keyof typeof tapCommands]
      : undefined

    if (!definition) {
      return {
        ok: false,
        code: 'UNKNOWN_COMMAND',
        message: `"${command}" is not a command of this Cypress (v${this.cypressVersion}). Available commands: ${Object.keys(tapCommands).join(', ')}.`,
      }
    }

    const optionSchema = definition.options ?? []

    const coercedArgs = coerceCommandArgs(command, definition.params, args, optionSchema)

    if (!coercedArgs.ok) {
      return { ok: false, code: 'INVALID_ARGUMENTS', message: coercedArgs.message }
    }

    const coercedOptions = coerceCommandOptions(command, definition.params, optionSchema, options)

    if (!coercedOptions.ok) {
      return { ok: false, code: 'INVALID_ARGUMENTS', message: coercedOptions.message }
    }

    return { ok: true, result: await definition.handler(coercedArgs.args, coercedOptions.options) }
  }
}
