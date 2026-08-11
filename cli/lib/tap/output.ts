import commander from 'commander'
import chalk from 'chalk'

import logger from '../logger'
import { docsUrl, formErrorText } from '../errors'
import util from '../util'
import { renderingFor } from './render'
import type { InstanceSelection } from '../cypress-instances'
import { tapErrorCopy } from '@packages/cypress-instances'
import type { TapErrorCopy, TapSchema } from '@packages/cypress-instances'

// The registry keeps its copy dependency-free, so the commands it names arrive in
// backticks for the CLI to colour the way the rest of the catalogue already does.
const highlight = (copy: string): string => copy.replace(/`([^`]+)`/g, (_match, command) => chalk.cyan(command))

/**
 * Expands an entry's metadata into the trailing blocks it asks for, so guidance
 * repeated across errors is declared once per entry rather than written out again
 * in each one.
 */
const solutionFor = (copy: TapErrorCopy): string => {
  const parts = [highlight(copy.solution)]

  if (copy.docs) {
    parts.push(`Learn more:\n\n  ${chalk.blue(`${docsUrl}${copy.docs}`)}`)
  }

  if (copy.recommendGhIssue) {
    parts.push(`If the problem persists, search for an existing issue or open a GitHub issue at\n\n  ${chalk.blue(util.issuesUrl)}`)
  }

  return parts.join('\n\n')
}

/**
 * The single exit for every tap failure, whether the CLI raised it or it arrived
 * from the instance as a wire payload: the code selects the copy, `detail` carries
 * whatever was specific to this one, and `formErrorText` lays it out the way every
 * other CLI error is laid out. The code itself is never printed. An error with no
 * code is not ours to render and keeps unwinding.
 */
export const renderTapFailure = async (err: any): Promise<number> => {
  if (typeof err?.code !== 'string') {
    throw err
  }

  const copy = tapErrorCopy(err.code)
  const detail = typeof err.detail === 'string' && err.detail !== '' ? highlight(err.detail) : undefined

  logger.errorToStderr(await formErrorText({
    description: highlight(copy.description),
    solution: solutionFor(copy),
  }, detail))

  return 1
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

const unknownCommandDetail = (program: commander.Command, schema: TapSchema, command: string): string => {
  const available = program.commands.map((subcommand) => subcommand.name()).join(', ')

  return `"${command}" is not available in this Cypress (v${schema.cypressVersion}), which offers: ${available}.`
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

const renderHelp = async (program: commander.Command, schema: TapSchema, command: string | undefined, banner?: string): Promise<number> => {
  const prefix = banner ? `${banner}\n\n` : ''

  if (command) {
    const subcommand = program.commands.find((sub) => sub.name() === command)

    if (!subcommand) {
      return await renderTapFailure({ code: 'UNKNOWN_COMMAND', detail: unknownCommandDetail(program, schema, command) })
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

export const renderSchemaHelp = (program: commander.Command, schema: TapSchema, selection: InstanceSelection, command: string | undefined): Promise<number> => {
  return renderHelp(program, schema, command, instanceBanner(schema, selection))
}

export const renderStaticHelp = (program: commander.Command, schema: TapSchema, command: string | undefined): Promise<number> => {
  return renderHelp(program, schema, command)
}
