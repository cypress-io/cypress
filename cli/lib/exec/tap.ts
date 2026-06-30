import Debug from 'debug'
import commander from 'commander'

import { RunnerDiscoveryError, listLiveRunners, resolveRunner } from '../runner-instances'
import { withTapSession, throwTapError } from '../tap/tap-session'
import type { TapSession } from '../tap/tap-session'
import { buildTapProgram } from '../tap/build-program'
import { renderFailure, renderKnownFailure, renderInstancesHelp, renderResult, renderGenericHelp, renderSchemaHelp } from '../tap/output'
import { TAP_EXEC_METHOD, TAP_PROTOCOL_VERSION, TAP_SCHEMA_METHOD } from '../tap/contract'
import type { TapExecResult, TapSchema } from '../tap/contract'
import { errors } from '../errors'

const debug = Debug('cypress:cli:tap')

interface TapCliOptions {
  instance?: number
}

const validateSchema = (value: unknown): TapSchema => {
  const schema = value as TapSchema | null | undefined

  if (!schema || typeof schema !== 'object' || typeof schema.protocolVersion !== 'number' || !Array.isArray(schema.commands)) {
    return throwTapError(errors.tapInvalidSchema, `${TAP_SCHEMA_METHOD} returned an unrecognizable schema.`)
  }

  if (schema.protocolVersion > TAP_PROTOCOL_VERSION) {
    return throwTapError(errors.tapUnsupportedProtocol, `schema protocol v${schema.protocolVersion} is newer than the CLI's v${TAP_PROTOCOL_VERSION}.`)
  }

  if (schema.protocolVersion < TAP_PROTOCOL_VERSION) {
    return throwTapError(errors.tapOutdatedProtocol, `schema protocol v${schema.protocolVersion} is older than the CLI's v${TAP_PROTOCOL_VERSION}.`)
  }

  return schema
}

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

const buildCommandInfo = (operands: string[]): CommandInfo => {
  const wantsHelp = operands.some(isHelpFlag)
  const positionals = operands.filter((arg) => !isHelpFlag(arg))
  const command = positionals[0]

  return { wantsHelp, positionals, command }
}

const execCommand = async (session: TapSession, command: string, commandArgs: Record<string, string>, commandOptions: Record<string, string>): Promise<number> => {
  const outcome = validateExecResult(await session.call(TAP_EXEC_METHOD, [command, commandArgs, commandOptions]))

  if (!outcome.ok) {
    renderFailure(outcome)

    return 1
  }

  renderResult(outcome.result)

  return 0
}

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

    if (command === 'instances') {
      return listInstances(options, wantsHelp)
    }

    try {
      const selection = await resolveRunner({ instance: options.instance, cwd: process.cwd() })

      return await withTapSession(selection.runner, async (session) => {
        const schema = validateSchema(await session.call(TAP_SCHEMA_METHOD))

        let dispatchCode = 0
        const program = buildTapProgram(schema, async (name, args, options) => {
          dispatchCode = await execCommand(session, name, args, options)
        })

        if (wantsHelp || !command) {
          return renderSchemaHelp(program, schema, selection, command, wantsHelp)
        }

        try {
          await program.parseAsync(positionals, { from: 'user' })
        } catch (err: any) {
          if (err instanceof commander.CommanderError) {
            return 1
          }

          throw err
        }

        return dispatchCode
      })
    } catch (err: any) {
      if (err instanceof RunnerDiscoveryError) {
        if ((wantsHelp || !command) && err.code === 'NO_DISCOVERY_FILE') {
          return renderGenericHelp(wantsHelp)
        }

        debug('tap %s failed: %s %s', command || '(help)', err.code, err.message)
        renderFailure(err)

        return 1
      }

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
