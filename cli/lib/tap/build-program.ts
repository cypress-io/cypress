import commander from 'commander'

import { tapCliCommands } from './commands'
import type { TapCliCommand } from './types'
import { MissingArgumentsTapError, MissingOptionTapError, TapError, UnknownCommandTapError, UnknownOptionTapError } from '@packages/cypress-instances'
import type { TapCommandOptionSchema, TapCommandParamSchema, TapSchema } from '@packages/cypress-instances'

type TapDispatch = (command: string, args: Record<string, string>, options: Record<string, string>) => Promise<void> | void

interface CommandSpec {
  name: string
  description: string
  params?: readonly TapCommandParamSchema[]
  options?: readonly TapCommandOptionSchema[]
}

// attributeName() exists at runtime in commander 6 but is only typed from v7
type DeclaredOption = commander.Option & { attributeName(): string }

const argumentsOf = (params: readonly TapCommandParamSchema[]): string => {
  return params.map(({ name, required }) => required ? `<${name}>` : `[${name}]`).join(' ')
}

const argumentDescriptions = (params: readonly TapCommandParamSchema[]): Record<string, string> => {
  return Object.fromEntries(params.map(({ name, description }) => [name, description]))
}

const JSON_DESCRIPTION = 'print the raw JSON result instead of the human-readable rendering'

// Every tap command accepts `--instance`, `--json` and `--timeout`; all are
// consumed by the top-level `cypress tap` command before a subprogram parses, so
// declaring them on a command is purely so they render in its generated help.
// `--timeout` keeps no alias: `-t` is worth more to `--test-id`, which is typed
// far more often, and the shared flags have to spell the same on every command.
const declareSharedOptions = (command: commander.Command, jsonDescription: string): void => {
  command.option('-i, --instance <pid>', 'target a specific running Cypress instance by its server process id (pid)')
  command.option('--json', jsonDescription)
  command.option('--timeout <ms>', 'how long to wait on any single call into the running Cypress, in milliseconds (default 30000)')
}

const declareOptions = (command: commander.Command, options: readonly TapCommandOptionSchema[]): void => {
  // A command that declares `--json` in its schema does so to receive it, not to
  // add a second flag — it is declared below with the ones every command shares,
  // so the schema contributes only its description.
  const json = options.find(({ name }) => name === 'json')

  for (const { name, alias, type, required, description } of options.filter((option) => option !== json)) {
    const lead = alias ? `-${alias}, ` : ''
    const flags = type === 'boolean' ? `${lead}--${name}` : `${lead}--${name} <${name}>`

    if (required && type !== 'boolean') {
      command.requiredOption(flags, description)
    } else {
      command.option(flags, description)
    }
  }

  declareSharedOptions(command, json?.description ?? JSON_DESCRIPTION)
}

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

// commander's own answers to a malformed invocation — an unknown name or flag, a
// required input left out — are patched CLI-wide (see `lib/cli.ts`) to print their
// own wording and exit the process. tap raises them as the tap failures they are and
// lets them unwind to the one place every tap failure renders, so the replacements
// land on the instance, where they take precedence over that patched prototype. The
// generated help is the remedy for all of them: whatever the reader typed, it names
// what they could have.
type InvalidInputHandlers = commander.Command & {
  _allowUnknownOption?: boolean
  unknownOption(flag: string): void
  unknownCommand(): void
  missingArgument(name: string): void
  optionMissingArgument(option: commander.Option): void
  missingMandatoryOptionValue(option: commander.Option): void
}

const answerUnknownOption = (command: commander.Command): void => {
  (command as InvalidInputHandlers).unknownOption = function (flag: string): void {
    if (this._allowUnknownOption) {
      return
    }

    throw new UnknownOptionTapError(flag)
  }
}

const answerUnknownCommand = (program: commander.Command): void => {
  (program as InvalidInputHandlers).unknownCommand = function (): void {
    throw new UnknownCommandTapError(this.args[0])
  }
}

// The flag as the reader would have typed it: every tap option declares a long
// form, and the raw flags stand in for anything that somehow does not.
const flagOf = (option: commander.Option): string => option.long || option.flags

/**
 * The three ways commander finds an invocation short of what the command declares.
 * A missing positional is reported for all of them at once — commander announces
 * only the first, while the reader is better served by the whole list — hence the
 * declared params rather than the name commander passed, which stands in only if
 * nothing else can be matched to it.
 */
const answerMissingInput = (command: commander.Command, name: string, params: readonly TapCommandParamSchema[]): void => {
  const handlers = command as InvalidInputHandlers

  handlers.missingArgument = function (missing: string): void {
    const absent = params.filter(({ required }, index) => required && this.args[index] === undefined).map((param) => param.name)

    throw new MissingArgumentsTapError(name, absent.length ? absent : [missing])
  }

  handlers.optionMissingArgument = function (option: commander.Option): void {
    throw new TapError('INVALID_OPTIONS', { detail: `"${name}" was given the ${flagOf(option)} option without a value.` })
  }

  handlers.missingMandatoryOptionValue = function (option: commander.Option): void {
    throw new MissingOptionTapError(name, flagOf(option).replace(/^--/, ''))
  }
}

const rejectExcessArguments = (name: string, params: readonly TapCommandParamSchema[], args: readonly string[]): void => {
  if (args.length <= params.length) {
    return
  }

  const given = args.length === 1 ? '1 argument was' : `${args.length} arguments were`
  const takes = params.length === 0 ? 'takes none' : `takes at most ${params.length}`

  throw new TapError('INVALID_ARGUMENTS', { detail: `${given} passed to "${name}", but it ${takes}.` })
}

const forwardedOptions = (command: commander.Command, options: readonly TapCommandOptionSchema[]): Record<string, string> => {
  const opts = command.opts()
  const declared = command.options as DeclaredOption[]
  const forwarded: Record<string, string> = {}

  // commander stores `--dry-run` under opts().dryRun, so resolve each schema
  // name to its declared option's attribute key rather than assuming they match
  for (const { name } of options) {
    const option = declared.find((declaredOption) => declaredOption.long === `--${name}`)
    const value = option && opts[option.attributeName()]

    if (value !== undefined) {
      forwarded[name] = String(value)
    }
  }

  return forwarded
}

const declareCommand = (program: commander.Command, spec: CommandSpec, dispatch?: TapDispatch): void => {
  const { name, description, params = [], options = [] } = spec
  const command = program.command(name)

  // Keep option values in opts() so schema names such as `command` cannot
  // collide with Command instance methods.
  command.storeOptionsAsProperties(false)

  if (params.length) {
    command.arguments(argumentsOf(params))
    command.description(description, argumentDescriptions(params))
  } else {
    command.description(description)
  }

  declareOptions(command, options)
  answerUnknownOption(command)
  answerMissingInput(command, name, params)

  if (dispatch) {
    command.action(() => {
      rejectExcessArguments(name, params, command.args)

      return dispatch(name, forwardedArgs(params, command.args), forwardedOptions(command, options))
    })
  }
}

const newProgram = (): commander.Command => {
  const program = new commander.Command('cypress tap')

  program.exitOverride()
  program.addHelpCommand(false)
  program.description('Interacts with a running Cypress instance')
  program.usage('[command] [args...] [options]')
  answerUnknownOption(program)
  answerUnknownCommand(program)
  answerMissingInput(program, program.name(), [])

  return program
}

export const buildTapProgram = (schema: TapSchema, dispatch: TapDispatch): commander.Command => {
  const program = newProgram()

  // The outer `tap` command owns --instance/--json/--timeout and parses them
  // before this program runs, so they never reach here — declared only so help
  // lists them. The outer command disables its own help, making this the sole
  // place they surface.
  declareSharedOptions(program, JSON_DESCRIPTION)

  for (const native of tapCliCommands) {
    declareCommand(program, native)
  }

  // An older instance may still advertise a command the CLI has since made
  // native; start() dispatches natives before ever consulting the schema, so
  // skip the shadowed advertisement rather than registering a duplicate.
  const nativeNames = new Set(tapCliCommands.map(({ name }) => name))

  for (const command of schema.commands.filter(({ name, hidden }) => !hidden && !nativeNames.has(name))) {
    declareCommand(program, command, dispatch)
  }

  return program
}

// A one-command program used by exec/tap.ts to parse a single CLI-native
// command, so its positionals and options validate through the same commander
// grammar the schema commands use.
export const buildNativeProgram = (native: TapCliCommand, dispatch: TapDispatch): commander.Command => {
  const program = newProgram()

  // A native command's standalone help is rendered only here, so its full
  // `details` prose stands in for the one-line `description` commander prints
  // between the usage line and the generated Arguments/Options sections.
  declareCommand(program, { ...native, description: native.details ?? native.description }, dispatch)

  return program
}
