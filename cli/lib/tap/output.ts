import commander from 'commander'

import logger from '../logger'
import { renderingFor } from './render'
import { noteTapFailure } from './events'
import type { SessionSelection } from '../cypress-sessions'
import type { TapSchema } from '@packages/cypress-sessions'

// Codes whose message already reads as a complete explanation with its own
// guidance; printing the code in front of one adds noise rather than context.
// The failure is still reported by code either way.
const SELF_DESCRIBING_CODES = new Set(['UNSUPPORTED_BROWSER'])

export const renderFailure = (err: { code: string, message: string }): void => {
  noteTapFailure(err.code)
  logger.errorToStderr(SELF_DESCRIBING_CODES.has(err.code) ? err.message : `${err.code}: ${err.message}`)
}

export const renderKnownFailure = (err: { details: { description: string, solution: string } }): void => {
  logger.errorToStderr(`${err.details.description}\n\n${err.details.solution}`)
}

export const renderResult = (result: unknown): void => {
  logger.always(typeof result === 'string' ? result : JSON.stringify(result, null, 2))
}

/**
 * Print a command's result: its human-readable rendering when the command
 * defines one (see `./render`), the raw JSON otherwise or when `--json` asks
 * for it explicitly. The invoked options are forwarded because a command's
 * result shape can depend on them (`command --json`) — as can whether a
 * rendering applies at all, which a renderer signals by returning undefined.
 */
export const renderOutcome = (command: string, result: unknown, json: boolean | undefined, options: Record<string, string> = {}): void => {
  const rendered = json ? undefined : renderingFor(command)?.renderHuman(result, options)

  if (rendered !== undefined) {
    logger.always(rendered)

    return
  }

  renderResult(result)
}

export const renderNativeHelp = (program: commander.Command, command: string): void => {
  logger.always(program.commands.find((subcommand) => subcommand.name() === command)!.helpInformation())
}

const unknownCommandMessage = (program: commander.Command, schema: TapSchema, command: string): string => {
  const available = program.commands.map((subcommand) => subcommand.name()).join(', ')

  return `"${command}" is not a command of this Cypress (v${schema.cypressVersion}). Available commands: ${available}.`
}

const sessionBanner = (schema: TapSchema, selection: SessionSelection): string => {
  const { session, candidateCount } = selection

  const target = `Target:
  ${session.projectRoot}
  v${schema.cypressVersion}
  pid:${session.pid}`

  if (candidateCount > 1) {
    return `${target}\n${candidateCount} running instances matched; targeting pid ${session.pid}. Pass --instance <pid> to target another.`
  }

  return target
}

const renderHelp = (program: commander.Command, schema: TapSchema, command: string | undefined, banner?: string): number => {
  const prefix = banner ? `${banner}\n\n` : ''

  if (command) {
    const subcommand = program.commands.find((sub) => sub.name() === command)

    if (!subcommand) {
      renderFailure({ code: 'UNKNOWN_COMMAND', message: unknownCommandMessage(program, schema, command) })

      return 1
    }

    // Standalone help is the only place a schema command's full `details` prose
    // renders, so it stands in for the one-line `description` — the same swap
    // buildNativeProgram does for CLI-native commands.
    const details = schema.commands.find(({ name }) => name === command)?.details

    if (details) {
      subcommand.description(details)
    }

    logger.always(`${prefix}${subcommand.helpInformation()}`)

    return 0
  }

  logger.always(`${prefix}${program.helpInformation()}`)

  return 0
}

export const renderSchemaHelp = (program: commander.Command, schema: TapSchema, selection: SessionSelection, command: string | undefined): number => {
  return renderHelp(program, schema, command, sessionBanner(schema, selection))
}

export const renderStaticHelp = (program: commander.Command, schema: TapSchema, command: string | undefined): number => {
  return renderHelp(program, schema, command)
}
