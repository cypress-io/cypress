import commander from 'commander'

import logger from '../logger'
import type { InstanceSelection } from '../cypress-instances'
import type { TapSchema } from '@packages/cypress-instances'

export const renderFailure = (err: { code: string, message: string }): void => {
  logger.error(`${err.code}: ${err.message}`)
}

export const renderKnownFailure = (err: { details: { description: string, solution: string } }): void => {
  logger.error(`${err.details.description}\n\n${err.details.solution}`)
}

export const renderResult = (result: unknown): void => {
  logger.always(typeof result === 'string' ? result : JSON.stringify(result, null, 2))
}

export const renderNativeHelp = (program: commander.Command, command: string): void => {
  logger.always(program.commands.find((subcommand) => subcommand.name() === command)!.helpInformation())
}

const unknownCommandMessage = (program: commander.Command, schema: TapSchema, command: string): string => {
  const available = program.commands.map((subcommand) => subcommand.name()).join(', ')

  return `"${command}" is not a command of this Cypress (v${schema.cypressVersion}). Available commands: ${available}.`
}

const instanceBanner = (schema: TapSchema, selection: InstanceSelection): string => {
  const { instance, candidateCount } = selection

  const target = `Target:
  ${instance.projectRoot}
  v${schema.cypressVersion}
  pid:${instance.pid}`

  if (candidateCount > 1) {
    return `${target}\n${candidateCount} running instances matched; targeting pid ${instance.pid}. Pass --instance <pid> to target another.`
  }

  return target
}

const renderHelp = (program: commander.Command, schema: TapSchema, command: string | undefined, wantsHelp: boolean, banner?: string): number => {
  const prefix = banner ? `${banner}\n\n` : ''

  if (command) {
    const subcommand = program.commands.find((sub) => sub.name() === command)

    if (!subcommand) {
      renderFailure({ code: 'UNKNOWN_COMMAND', message: unknownCommandMessage(program, schema, command) })

      return 1
    }

    logger.always(`${prefix}${subcommand.helpInformation()}`)

    return 0
  }

  logger.always(`${prefix}${program.helpInformation()}`)

  return wantsHelp ? 0 : 1
}

export const renderSchemaHelp = (program: commander.Command, schema: TapSchema, selection: InstanceSelection, command: string | undefined, wantsHelp: boolean): number => {
  return renderHelp(program, schema, command, wantsHelp, instanceBanner(schema, selection))
}

export const renderStaticHelp = (program: commander.Command, schema: TapSchema, command: string | undefined, wantsHelp: boolean): number => {
  return renderHelp(program, schema, command, wantsHelp)
}
