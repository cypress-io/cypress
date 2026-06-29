import Debug from 'debug'
import commander from 'commander'

import { RunnerDiscoveryError, listLiveRunners, resolveRunner } from '../runner-instances'
import { withTapSession, throwTapError } from '../tap/tap-session'
import type { TapSession } from '../tap/tap-session'
import { buildTapProgram } from '../tap/build-program'
import { renderFailure, renderKnownFailure, renderInstancesHelp, renderResult, respondToHelp } from '../tap/output'
import { TAP_EXEC_METHOD, TAP_PROTOCOL_VERSION, TAP_SCHEMA_METHOD } from '../tap/contract'
import type { TapExecResult, TapSchema } from '../tap/contract'
import { errors } from '../errors'

const debug = Debug('cypress:cli:tap')

interface TapCliOptions {
  instance?: number
}

/**
 * Shape-check what arrived over the wire before trusting it. The schema is
 * half of the handshake the CLI hardcodes, so an unrecognizable or
 * future-versioned schema is a transport-level failure, not a domain result.
 */
const validateSchema = (value: unknown): TapSchema => {
  const schema = value as TapSchema | null | undefined

  if (!schema || typeof schema !== 'object' || typeof schema.protocolVersion !== 'number' || !Array.isArray(schema.commands)) {
    return throwTapError(errors.tapInvalidSchema, `${TAP_SCHEMA_METHOD} returned an unrecognizable schema.`)
  }

  if (schema.protocolVersion !== TAP_PROTOCOL_VERSION) {
    return throwTapError(errors.tapUnsupportedProtocol, `schema protocol v${schema.protocolVersion} is newer than the CLI's v${TAP_PROTOCOL_VERSION}.`)
  }

  return schema
}

/**
 * Shape-check the `exec` envelope — the other half of the hardcoded
 * handshake. Anything that is not the envelope is a transport-level failure.
 */
const validateExecResult = (value: unknown): TapExecResult => {
  const outcome = value as TapExecResult | null | undefined

  if (!outcome || typeof outcome !== 'object' || typeof outcome.ok !== 'boolean') {
    return throwTapError(errors.tapInvalidExecResult, `${TAP_EXEC_METHOD} returned an unrecognizable result.`)
  }

  return outcome
}

const isHelpFlag = (arg: string): boolean => arg === '--help' || arg === '-h'

interface CommandInfo {
  wantsHelp: boolean
  positionals: string[]
  command: string | undefined
}

// Derive everything we need about an invocation from the raw operands before
// we ever touch the runner.
const buildCommandInfo = (operands: string[]): CommandInfo => {
  const wantsHelp = operands.some(isHelpFlag)
  const positionals = operands.filter((arg) => !isHelpFlag(arg))
  const command = positionals[0]

  return { wantsHelp, positionals, command }
}

// Forward one resolved command to the binding's `exec` and render its result.
const execCommand = async (session: TapSession, command: string, commandArgs: Record<string, string>, commandOptions: Record<string, string>): Promise<number> => {
  const outcome = validateExecResult(await session.call(TAP_EXEC_METHOD, [command, commandArgs, commandOptions]))

  if (!outcome.ok) {
    renderFailure(outcome)

    return 1
  }

  renderResult(outcome.result)

  return 0
}

/**
 * The CLI-native `instances` command. Unlike every schema-discovered command,
 * it enumerates the discovery layer across runners rather than dispatching to
 * one instance's binding — so it opens no session, needs no attached browser,
 * and lists every live runner (`--instance` only narrows it to a single pid).
 * Renders the live runners as the same JSON `renderResult` uses for command
 * results, each keyed by the pid a user can hand back to `--instance`.
 */
const listInstances = async (options: TapCliOptions, wantsHelp: boolean): Promise<number> => {
  if (wantsHelp) {
    renderInstancesHelp()

    return 0
  }

  const runners = await listLiveRunners({ instance: options.instance })

  renderResult(runners.map((runner) => ({
    pid: runner.pid,
    projectRoot: runner.projectRoot,
    serverPort: runner.serverPort,
    browserAttached: runner.cdpBrowserWsUrl !== null,
  })))

  return 0
}

const tapModule = {
  async start (operands: string[] = [], options: TapCliOptions = {}): Promise<number> {
    debug('tap invocation %o with options %o', operands, options)

    const { wantsHelp, positionals, command } = buildCommandInfo(operands)

    // `instances` is the one command name the CLI reserves: it never reaches a
    // binding, so it short-circuits before any session is opened. (A running
    // instance that advertised `instances` in its schema would be shadowed
    // here.)
    if (command === 'instances') {
      return listInstances(options, wantsHelp)
    }

    try {
      // Resolve which running Cypress to target up front — a lone instance is
      // used wherever it lives; the cwd only breaks ties among several (see
      // resolveRunner). The selection is threaded into help so it can name the
      // instance it landed on.
      const selection = await resolveRunner({ instance: options.instance, cwd: process.cwd() })

      return await withTapSession(selection.runner, async (session) => {
        const schema = validateSchema(await session.call(TAP_SCHEMA_METHOD))

        let dispatchCode = 0
        const program = buildTapProgram(schema, async (name, args, options) => {
          dispatchCode = await execCommand(session, name, args, options)
        })

        if (wantsHelp || !command) {
          return respondToHelp({ command, wantsHelp, schema, program, selection })
        }

        try {
          await program.parseAsync(positionals, { from: 'user' })
        } catch (err: any) {
          // commander already wrote its own message to stderr, so a parse
          // failure just needs to surface as a non-zero exit.
          if (err instanceof commander.CommanderError) {
            return 1
          }

          throw err
        }

        return dispatchCode
      })
    } catch (err: any) {
      if (err instanceof RunnerDiscoveryError) {
        // No reachable instance while the user wanted help: show generic usage
        // rather than the discovery error.
        if (wantsHelp || !command) {
          return respondToHelp({ command, wantsHelp })
        }

        debug('tap %s failed: %s %s', command || '(help)', err.code, err.message)
        renderFailure(err)

        return 1
      }

      // A known tap transport/handshake failure carries the mapped Cypress
      // error in `details`; anything else is unexpected and rethrows to the
      // generic CLI error path.
      if (err.known && err.details) {
        debug('tap %s failed: %s', command || '(help)', err.message)
        renderKnownFailure(err)

        return 1
      }

      throw err
    }
  },
}

export default tapModule
