import commander from 'commander'

import type { TapCommandOptionSchema, TapCommandParamSchema, TapSchema } from './contract'

/**
 * Invoked when a built subcommand matches: receives the command name, its
 * positional args keyed by their schema param name, and a map of the parsed
 * option values keyed by option name. Both are forwarded verbatim as strings —
 * validation and type coercion are the running instance's job, so the
 * dispatcher passes strings straight through to the binding's `exec`; the CLI
 * never interprets types. Args and options share the same name-keyed shape so
 * the binding receives one consistent format.
 */
type TapDispatch = (command: string, args: Record<string, string>, options: Record<string, string>) => Promise<void> | void

// `run <spec>` for one required param, `foo <bar> [baz]` with an optional
// second — commander's positional-argument grammar, derived from the schema.
const argumentsOf = (params: readonly TapCommandParamSchema[]): string => {
  return params.map(({ name, required }) => required ? `<${name}>` : `[${name}]`).join(' ')
}

const argumentDescriptions = (params: readonly TapCommandParamSchema[]): Record<string, string> => {
  return Object.fromEntries(params.map(({ name, description }) => [name, description]))
}

// Declare each schema option on the subcommand: `--headed` for a boolean flag,
// `--browser <browser>` for a value option, each with an optional `-b` short
// alias. A required value option uses `requiredOption` so commander enforces
// presence; the binding re-checks app-side regardless. No custom parser is
// attached, so commander yields raw strings and coercion stays app-side.
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

// commander hands positionals back as an array in declaration order; key each
// supplied one by its schema param name — the positional twin of
// `forwardedOptions` — so args reach the binding name-keyed, not positional.
// An absent trailing optional simply has no operand and so gets no key.
// `rejectExcessArguments` has already run, so `args.length <= params.length`.
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

// commander 6 keeps operands beyond the declared params in `matched.args`
// rather than rejecting them (it has no `allowExcessArguments`), and a
// name-keyed arg object can't carry the extras anyway — so reject them here at
// the parse layer, the same exit-1-with-a-stderr-message shape commander uses
// for its own `missingArgument`/`unknownOption`. The binding still re-checks
// for unknown keys as defense-in-depth.
const rejectExcessArguments = (name: string, params: readonly TapCommandParamSchema[], args: readonly string[]): void => {
  if (args.length <= params.length) {
    return
  }

  const message = `error: too many arguments for '${name}'. Expected ${params.length} argument(s) but got ${args.length}.`

  console.error(message)
  throw new commander.CommanderError(1, 'commander.excessArguments', message)
}

// commander parses `--browser chrome` to the string `'chrome'`, a present
// boolean flag to `true`, and leaves an absent option `undefined`. Forward the
// supplied ones keyed by their schema name as raw strings; the binding coerces
// them to the declared type, exactly as it does positionals. Keying by the
// schema name (a single dash-free token) sidesteps commander's camelCasing.
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
 * subcommand per advertised command, its positional arguments, options, and
 * help text derived from the command's param and option schema. The program
 * name is `cypress tap` so generated usage reads as the user typed it.
 *
 * `exitOverride` turns commander's own argument validation and help into
 * catchable `CommanderError`s instead of process exits, so the orchestrator
 * can route them through the logger.
 *
 * A matched subcommand forwards its positional and option values to
 * `dispatch`, each keyed by its schema name, which hands them to the binding's
 * `exec`.
 */
export const buildTapProgram = (schema: TapSchema, dispatch: TapDispatch): commander.Command => {
  const program = new commander.Command('cypress tap')

  program.exitOverride()
  // No implicit `help` subcommand: every command name is the running
  // instance's to define, so `tap help` is just an unknown command.
  program.addHelpCommand(false)
  program.description('Interacts with a running Cypress instance')

  // `instances` is the CLI's own command — it enumerates the discovery layer
  // rather than dispatching to a running instance — but it belongs at the top
  // of the command list alongside the discovered ones. `../exec/tap` intercepts
  // it before this program is parsed, so this entry exists only for help; its
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
      // commander appends any excess operands AFTER the command in that list,
      // so positionally fishing it out breaks on the very case we reject below.
      // `command.args` are the raw positional operands and `.opts()` the parsed
      // options. Reject any operands beyond the declared params, then key the
      // positionals by their schema param name so args and options reach the
      // binding in the same name-keyed shape.
      rejectExcessArguments(name, params, command.args)

      return dispatch(name, forwardedArgs(params, command.args), forwardedOptions(options, command.opts()))
    })
  }

  return program
}
