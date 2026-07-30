import commander from 'commander'

import { tapCliCommands } from './commands'
import { renderOptionsFor } from './render'
import type { TapCliCommand } from './types'
import type { TapCommandOptionSchema, TapCommandParamSchema, TapSchema } from '@packages/cypress-instances'

type TapDispatch = (command: string, args: Record<string, string>, options: Record<string, string>, renderOptions: Record<string, string>) => Promise<void> | void

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

  // Every tap command accepts `--instance` and `--json`; both are consumed by
  // the top-level `cypress tap` command before a subprogram parses, so declaring
  // them here is purely so they render in each command's generated help.
  command.option('--instance <pid>', 'target a specific running Cypress instance by its server process id (pid)')
  command.option('--json', 'print the raw JSON result instead of the human-readable rendering')
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

const rejectExcessArguments = (name: string, params: readonly TapCommandParamSchema[], args: readonly string[]): void => {
  if (args.length <= params.length) {
    return
  }

  const message = `error: too many arguments for '${name}'. Expected ${params.length} argument(s) but got ${args.length}.`

  console.error(message)
  throw new commander.CommanderError(1, 'commander.excessArguments', message)
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

  // A command's view-only options are declared alongside the schema's so they
  // render in the same help, but they are collected apart from them: only the
  // schema's reach the instance.
  const renderOptions = renderOptionsFor(name)

  declareOptions(command, [...options, ...renderOptions])

  if (dispatch) {
    command.action(() => {
      rejectExcessArguments(name, params, command.args)

      return dispatch(name, forwardedArgs(params, command.args), forwardedOptions(command, options), forwardedOptions(command, renderOptions))
    })
  }
}

const newProgram = (): commander.Command => {
  const program = new commander.Command('cypress tap')

  program.exitOverride()
  program.addHelpCommand(false)
  program.description('Interacts with a running Cypress instance')
  program.usage('[command] [args...] [options]')

  return program
}

export const buildTapProgram = (schema: TapSchema, dispatch: TapDispatch): commander.Command => {
  const program = newProgram()

  // The outer `tap` command owns --instance/--json and parses them before this
  // program runs, so they never reach here — declared only so help lists them.
  // The outer command disables its own help, making this the sole place they
  // surface.
  program.option('--instance <pid>', 'target a specific running Cypress instance by its server process id (pid)')
  program.option('--json', 'print the raw JSON result instead of the human-readable rendering')

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
