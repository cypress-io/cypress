import commander from 'commander'

import type { TapCommandOptionSchema, TapCommandParamSchema, TapSchema } from './contract'

/**
 * Invoked when a built subcommand matches. Args and options are forwarded as
 * raw strings keyed by their schema name; type coercion is the running
 * instance's job, so the CLI never interprets types.
 */
type TapDispatch = (command: string, args: Record<string, string>, options: Record<string, string>) => Promise<void> | void

const argumentsOf = (params: readonly TapCommandParamSchema[]): string => {
  return params.map(({ name, required }) => required ? `<${name}>` : `[${name}]`).join(' ')
}

const argumentDescriptions = (params: readonly TapCommandParamSchema[]): Record<string, string> => {
  return Object.fromEntries(params.map(({ name, description }) => [name, description]))
}

// A required value option uses `requiredOption` so commander enforces presence;
// the binding re-checks app-side regardless. No custom parser is attached, so
// commander yields raw strings and coercion stays app-side.
const declareOptions = (command: commander.Command, options: readonly TapCommandOptionSchema[]): void => {
  for (const { name, alias, type, required, description } of options) {
    const lead = alias ? `-${alias}, ` : ''
    const flags = type === 'boolean' ? `${lead}--${name}` : `${lead}--${name} <${name}>`

    if (required && type !== 'boolean') {
      command.requiredOption(flags, description)
    } else {
      command.option(flags, description)
    }
  }
}

// Key each positional by its schema param name so args reach the binding
// name-keyed, like options. `rejectExcessArguments` has already run, so
// `args.length <= params.length`.
const forwardedArgs = (params: readonly TapCommandParamSchema[], args: readonly string[]): Record<string, string> => {
  const forwarded: Record<string, string> = {}

  args.forEach((arg, index) => {
    const param = params[index]

    if (param) {
      forwarded[param.name] = arg
    }
  })

  return forwarded
}

// commander 6 keeps operands beyond the declared params rather than rejecting
// them (it has no `allowExcessArguments`), and a name-keyed arg object can't
// carry the extras anyway — so reject them here at the parse layer, in the same
// exit-1-with-a-stderr-message shape commander uses for `missingArgument`.
const rejectExcessArguments = (name: string, params: readonly TapCommandParamSchema[], args: readonly string[]): void => {
  if (args.length <= params.length) {
    return
  }

  const message = `error: too many arguments for '${name}'. Expected ${params.length} argument(s) but got ${args.length}.`

  console.error(message)
  throw new commander.CommanderError(1, 'commander.excessArguments', message)
}

// Forward supplied options as raw strings; the binding coerces them, as it does
// positionals. Keying by the schema name (a single dash-free token) sidesteps
// commander's camelCasing.
const forwardedOptions = (options: readonly TapCommandOptionSchema[], opts: Record<string, unknown>): Record<string, string> => {
  const forwarded: Record<string, string> = {}

  for (const { name } of options) {
    if (opts[name] !== undefined) {
      forwarded[name] = String(opts[name])
    }
  }

  return forwarded
}

/**
 * Build a commander program from a tap schema fetched at runtime: one
 * subcommand per advertised command. The program name is `cypress tap` so
 * generated usage reads as the user typed it.
 *
 * `exitOverride` turns commander's own argument validation and help into
 * catchable `CommanderError`s instead of process exits, so the orchestrator
 * can route them through the logger.
 */
export const buildTapProgram = (schema: TapSchema, dispatch: TapDispatch): commander.Command => {
  const program = new commander.Command('cypress tap')

  program.exitOverride()
  // No implicit `help` subcommand: every command name is the running
  // instance's to define, so `tap help` is just an unknown command.
  program.addHelpCommand(false)
  program.description('Interacts with a running Cypress instance')

  // `instances` is the CLI's own command — it enumerates the discovery layer
  // rather than dispatching to a running instance. `../exec/tap` intercepts it
  // before this program is parsed, so this entry exists only for help; its
  // action never runs.
  program
  .command('instances')
  .description('list the running Cypress instances this CLI can reach')
  .action(() => {})

  for (const { name, description, params, options = [] } of schema.commands) {
    const command = program.command(name)

    if (params.length) {
      command.arguments(argumentsOf(params))
      command.description(description, argumentDescriptions(params))
    } else {
      command.description(description)
    }

    declareOptions(command, options)

    command.action(() => {
      // Read the matched command from the closure, not the action's varargs:
      // commander appends excess operands AFTER the command in that list, so
      // positionally fishing it out breaks on the very case we reject below.
      rejectExcessArguments(name, params, command.args)

      return dispatch(name, forwardedArgs(params, command.args), forwardedOptions(options, command.opts()))
    })
  }

  return program
}
