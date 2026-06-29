import commander from 'commander'

import logger from '../logger'
import type { RunnerSelection } from '../runner-instances'
import type { TapSchema } from './contract'

// A coded failure: an app-side domain result (`{ ok: false }`) or a discovery
// error. Its code is shown as a diagnostic prefix.
export const renderFailure = (err: { code: string, message: string }): void => {
  logger.error(`${err.code}: ${err.message}`)
}

// A known transport failure thrown by the tap session or handshake: render the
// mapped Cypress error's user-facing description and how to fix it.
export const renderKnownFailure = (err: { details: { description: string, solution: string } }): void => {
  logger.error(`${err.details.description}\n\n${err.details.solution}`)
}

export const renderResult = (result: unknown): void => {
  // Scalar results print bare (health prints `ok`); structured results print
  // as readable (pretty) JSON.
  logger.always(typeof result === 'string' ? result : JSON.stringify(result, null, 2))
}

// Static usage shown when no running Cypress can be reached: the per-instance
// commands are schema-derived, so none can be listed without a live instance.
// Only `instances` — the CLI's own command — is always available, so it is the
// one command this fallback names.
const GENERIC_TAP_USAGE = [
  'Usage: cypress tap [command] [args...] [options]',
  '',
  'Interacts with a running Cypress instance over its tap binding.',
  '',
  'Commands:',
  '  instances  list the running Cypress instances this CLI can reach',
  '',
  'Other commands are discovered from the running Cypress instance — start',
  'Cypress (e.g. `cypress open`), then run `cypress tap` to see them.',
  '',
  'Options:',
  '  --instance <pid>  target a specific running Cypress instance by its pid',
].join('\n')

// Static usage for the CLI-native `instances` command. It never reaches a
// binding, so — like the generic usage — it is hardcoded rather than
// schema-derived.
const INSTANCES_USAGE = [
  'Usage: cypress tap instances [options]',
  '',
  'Lists the running Cypress instances this CLI can reach (those whose tap',
  'binding answers a liveness probe), as a JSON array. Pass a runner\'s pid to',
  '`--instance` to target it with another tap command.',
  '',
  'Options:',
  '  --instance <pid>  only list the runner with this pid',
].join('\n')

export const renderInstancesHelp = (): void => {
  logger.always(INSTANCES_USAGE)
}

const unknownCommandMessage = (schema: TapSchema, command: string): string => {
  return `"${command}" is not a command of this Cypress (v${schema.cypressVersion}). Available commands: ${schema.commands.map(({ name }) => name).join(', ')}.`
}

// A short banner naming the instance every command in this help would target,
// so the user can see what `cypress tap <command>` resolved to. When several
// runners were live, it also says which one was picked and how to override —
// the only place the auto-selection is surfaced (command output stays clean).
const instanceBanner = (schema: TapSchema, selection: RunnerSelection): string => {
  const { runner, candidateCount } = selection

  const target = [
    'Target:',
    `  ${runner.projectRoot}`,
    `  v${schema.cypressVersion}`,
    `  pid:${runner.pid}`,
  ].join('\n')

  if (candidateCount > 1) {
    return `${target}\n${candidateCount} running instances matched; targeting pid ${runner.pid}. Pass --instance <pid> to target another.`
  }

  return target
}

/**
 * Rich help, derived from the live schema: with a command, print that
 * subcommand's commander-generated usage (its positional grammar and param
 * descriptions); otherwise print the overview. Either way it leads with the
 * banner naming the resolved instance. A help request for a command the
 * instance does not advertise is a failure.
 */
const renderSchemaHelp = (program: commander.Command, schema: TapSchema, selection: RunnerSelection, command: string | undefined, wantsHelp: boolean): number => {
  if (command) {
    const entry = schema.commands.find(({ name }) => name === command)

    if (!entry) {
      renderFailure({ code: 'UNKNOWN_COMMAND', message: unknownCommandMessage(schema, command) })

      return 1
    }

    // The matching subcommand always exists: the program is built from this
    // same schema.
    logger.always(`${instanceBanner(schema, selection)}\n\n${program.commands.find((subcommand) => subcommand.name() === command)!.helpInformation()}`)

    return 0
  }

  // The program now lists `instances` at the top of its commands, so the
  // overview needs nothing appended.
  logger.always(`${instanceBanner(schema, selection)}\n\n${program.helpInformation()}`)

  // An explicit `--help` is a success; a bare `cypress tap` is a usage prompt.
  return wantsHelp ? 0 : 1
}

// Shown when no running Cypress was found — the generic usage, exit 0 when the
// user asked for help and 1 when they were trying to do something.
const renderGenericHelp = (wantsHelp: boolean): number => {
  logger.always(GENERIC_TAP_USAGE)

  return wantsHelp ? 0 : 1
}

interface RespondToHelpOptions {
  command: string | undefined
  wantsHelp: boolean
  // Present only when a live instance was reached: the resolved runner, the
  // fetched schema, and the commander program built from it — they always
  // travel together. Their absence selects the generic usage.
  schema?: TapSchema
  program?: commander.Command
  selection?: RunnerSelection
}

/**
 * The one help entry point the CLI calls. When a live instance was reached
 * (its schema, program, and selection are all supplied), render the rich
 * schema-derived help led by the instance banner; otherwise — no reachable
 * instance — fall back to the generic usage. Returns the process exit code: an
 * explicit `--help` succeeds, a bare `cypress tap` is a usage prompt (exit 1),
 * and help for an unadvertised command is a failure.
 */
export const respondToHelp = ({ command, wantsHelp, schema, program, selection }: RespondToHelpOptions): number => {
  if (!schema || !program || !selection) {
    return renderGenericHelp(wantsHelp)
  }

  return renderSchemaHelp(program, schema, selection, command, wantsHelp)
}
