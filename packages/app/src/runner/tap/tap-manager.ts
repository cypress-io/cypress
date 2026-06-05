import { tapCommands } from './commands'
import type { TapCommandDefinition } from './commands'
import { coerceCommandArgs } from './exec-args'
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
      commands: Object.entries(tapCommands).map(([name, { description, params }]) => {
        return { name, description, params }
      }),
    }
  }

  /**
   * The single dispatch entry point. `command` and `args` arrive from the
   * wire as raw strings; args are validated and coerced against the
   * registry's param schema before the handler runs. `ok: false` covers
   * dispatch failures only — domain failures are values inside `ok: true`
   * results. A handler throw is a binding bug and propagates to the caller.
   */
  async exec (command: string, args: string[] = []): Promise<TapExecResult> {
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

    const coerced = coerceCommandArgs(command, definition.params, args)

    if (!coerced.ok) {
      return { ok: false, code: 'INVALID_ARGUMENTS', message: coerced.message }
    }

    return { ok: true, result: await definition.handler(...coerced.args) }
  }
}
