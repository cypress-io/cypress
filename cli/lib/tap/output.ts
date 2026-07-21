import commander from 'commander'

import logger from '../logger'
import type { InstanceSelection } from '../cypress-instances'
import type { TapCliCommand } from './types'
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

const genericTapUsage = (commands: readonly Pick<TapCliCommand, 'name' | 'description'>[]): string => {
  const width = Math.max(...commands.map(({ name }) => name.length))
  const commandList = commands.map(({ name, description }) => `  ${name.padEnd(width)}  ${description}`).join('\n')

  return `Usage: cypress tap [command] [args...] [options]

Interacts with a running Cypress instance over its tap binding.

Commands:
${commandList}

Other commands are discovered from the running Cypress instance — start
Cypress (e.g. \`cypress open\`), then run \`cypress tap\` to see them.

Options:
  --instance <pid>  target a specific running Cypress instance by its pid`
}

export const renderUsage = (usage: string): void => {
  logger.always(usage)
}

const unknownCommandMessage = (schema: TapSchema, command: string): string => {
  return `"${command}" is not a command of this Cypress (v${schema.cypressVersion}). Available commands: ${schema.commands.filter(({ hidden }) => !hidden).map(({ name }) => name).join(', ')}.`
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

export const renderSchemaHelp = (program: commander.Command, schema: TapSchema, selection: InstanceSelection, command: string | undefined, wantsHelp: boolean): number => {
  if (command) {
    const entry = schema.commands.find(({ name }) => name === command)

    if (!entry || entry.hidden) {
      renderFailure({ code: 'UNKNOWN_COMMAND', message: unknownCommandMessage(schema, command) })

      return 1
    }

    logger.always(`${instanceBanner(schema, selection)}\n\n${program.commands.find((subcommand) => subcommand.name() === command)!.helpInformation()}`)

    return 0
  }

  logger.always(`${instanceBanner(schema, selection)}\n\n${program.helpInformation()}`)

  return wantsHelp ? 0 : 1
}

export const renderGenericHelp = (wantsHelp: boolean, commands: readonly Pick<TapCliCommand, 'name' | 'description'>[]): number => {
  logger.always(genericTapUsage(commands))

  return wantsHelp ? 0 : 1
}
