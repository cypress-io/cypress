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

const GENERIC_TAP_USAGE = [
  'Usage: cypress tap [command] [args...] [options]',
  '',
  'Interacts with a running Cypress instance over its tap binding.',
  '',
  'Commands:',
  '  instances  list the running Cypress instances this CLI can reach',
  '  status     report where a running Cypress instance is in its lifecycle',
  '',
  'Other commands are discovered from the running Cypress instance — start',
  'Cypress (e.g. `cypress open`), then run `cypress tap` to see them.',
  '',
  'Options:',
  '  --instance <pid>  target a specific running Cypress instance by its pid',
].join('\n')

const INSTANCES_USAGE = [
  'Usage: cypress tap instances [options]',
  '',
  'Lists the running Cypress instances this CLI can reach (those whose tap',
  'binding answers a liveness probe), as a JSON array. Pass a instance\'s pid to',
  '`--instance` to target it with another tap command.',
  '',
  'Options:',
  '  --instance <pid>  only list the instance with this pid',
].join('\n')

export const renderInstancesHelp = (): void => {
  logger.always(INSTANCES_USAGE)
}

// Static usage for the CLI-native `status` command. Like `instances` it never
// reaches a binding to discover its grammar, so its help is hardcoded.
const STATUS_USAGE = [
  'Usage: cypress tap status [options]',
  '',
  'Reports where a running Cypress instance is in its lifecycle, as JSON — for',
  'polling and "where am I?" checks. Always exits 0 for a determinable stage',
  '(including "not connected"); a poller branches on the `status` field.',
  '',
  'Stages: not connected, browser not selected, spec not selected, running,',
  'passed, failed.',
  '',
  'Options:',
  '  --instance <pid>  report the runner with this pid',
].join('\n')

export const renderStatusHelp = (): void => {
  logger.always(STATUS_USAGE)
}

const unknownCommandMessage = (schema: TapSchema, command: string): string => {
  return `"${command}" is not a command of this Cypress (v${schema.cypressVersion}). Available commands: ${schema.commands.map(({ name }) => name).join(', ')}.`
}

const instanceBanner = (schema: TapSchema, selection: InstanceSelection): string => {
  const { instance, candidateCount } = selection

  const target = [
    'Target:',
    `  ${instance.projectRoot}`,
    `  v${schema.cypressVersion}`,
    `  pid:${instance.pid}`,
  ].join('\n')

  if (candidateCount > 1) {
    return `${target}\n${candidateCount} running instances matched; targeting pid ${instance.pid}. Pass --instance <pid> to target another.`
  }

  return target
}

export const renderSchemaHelp = (program: commander.Command, schema: TapSchema, selection: InstanceSelection, command: string | undefined, wantsHelp: boolean): number => {
  if (command) {
    const entry = schema.commands.find(({ name }) => name === command)

    if (!entry) {
      renderFailure({ code: 'UNKNOWN_COMMAND', message: unknownCommandMessage(schema, command) })

      return 1
    }

    logger.always(`${instanceBanner(schema, selection)}\n\n${program.commands.find((subcommand) => subcommand.name() === command)!.helpInformation()}`)

    return 0
  }

  logger.always(`${instanceBanner(schema, selection)}\n\n${program.helpInformation()}`)

  return wantsHelp ? 0 : 1
}

export const renderGenericHelp = (wantsHelp: boolean): number => {
  logger.always(GENERIC_TAP_USAGE)

  return wantsHelp ? 0 : 1
}
