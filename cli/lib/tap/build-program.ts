import commander from 'commander'

import type { TapCommandOptionSchema, TapCommandParamSchema, TapSchema } from './contract'

type TapDispatch = (command: string, args: Record<string, string>, options: Record<string, string>) => Promise<void> | void

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

export const buildTapProgram = (schema: TapSchema, dispatch: TapDispatch): commander.Command => {
  const program = new commander.Command('cypress tap')

  program.exitOverride()
  program.addHelpCommand(false)
  program.description('Interacts with a running Cypress instance')

  const instances = program
  .command('instances')
  .description('list the running Cypress instances this CLI can reach')

  instances.action(() => {
    rejectExcessArguments('instances', [], instances.args)
  })

  for (const { name, description, params = [], options = [] } of schema.commands) {
    const command = program.command(name)

    if (params.length) {
      command.arguments(argumentsOf(params))
      command.description(description, argumentDescriptions(params))
    } else {
      command.description(description)
    }

    declareOptions(command, options)

    command.action(() => {
      rejectExcessArguments(name, params, command.args)

      return dispatch(name, forwardedArgs(params, command.args), forwardedOptions(command, options))
    })
  }

  return program
}
