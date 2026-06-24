import { tapCommands } from './commands'
import type { TapCommandDefinition } from './commands'
import { coerceCommandArgs, coerceCommandOptions } from './exec-args'
import { TAP_PROTOCOL_VERSION } from './contract'
import type { TapBindingContract, TapExecResult, TapSchema } from './contract'

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
      protocolVersion: TAP_PROTOCOL_VERSION,
      cypressVersion: this.cypressVersion,
      commands: Object.entries(tapCommands).map(([name, definition]) => {
        // `satisfies` keeps each entry's narrow literal type, so a command that
        // omits the optional `options` has no such property to destructure;
        // widen to the definition shape to read it (defaulting to none).
        const { description, params, options } = definition as TapCommandDefinition

        return { name, description, params, options: options ?? [] }
      }),
    }
  }

  /**
   * The single dispatch entry point. `command`, `args`, and `options` arrive
   * from the wire as raw strings — `args` and `options` are both maps keyed by
   * schema name; both are validated and coerced against the registry's
   * param/option schema before the handler runs. The handler receives the
   * coerced params object followed by the coerced options object. `ok: false`
   * covers dispatch failures only — domain failures are values inside
   * `ok: true` results. A handler throw is a binding bug and propagates to the
   * caller.
   */
  async exec (command: string, args: Record<string, string> = {}, options: Record<string, string> = {}): Promise<TapExecResult> {
    // Own-property lookup: `command` is wire input, so an inherited name
    // like "constructor" must not resolve to a prototype member.
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
