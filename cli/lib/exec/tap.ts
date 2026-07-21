import Debug from 'debug'
import commander from 'commander'

import { CypressInstanceError, resolveInstance } from '../cypress-instances'
import { withTapSession, throwTapError, validateExecResult } from '../tap/tap-session'
import type { TapSession } from '../tap/tap-session'
import { buildTapProgram, rejectExcessArguments } from '../tap/build-program'
import { renderFailure, renderKnownFailure, renderResult, renderGenericHelp, renderSchemaHelp, renderUsage } from '../tap/output'
import { tapCliCommands } from '../tap/commands'
import type { TapCliOptions } from '../tap/types'
import { TAP_EXEC_METHOD, TAP_SCHEMA_VERSION, TAP_SCHEMA_METHOD } from '@packages/cypress-instances'
import type { TapSchema } from '@packages/cypress-instances'
import { errors } from '../errors'

const debug = Debug('cypress:cli:tap')

const validateSchema = (value: unknown): TapSchema => {
  const schema = value as TapSchema | null | undefined

  if (!schema || typeof schema !== 'object' || typeof schema.schemaVersion !== 'number' || !Array.isArray(schema.commands)) {
    return throwTapError(errors.tapInvalidSchema, `${TAP_SCHEMA_METHOD} returned an unrecognizable schema.`)
  }

  if (schema.schemaVersion > TAP_SCHEMA_VERSION) {
    return throwTapError(errors.tapUnsupportedProtocol, `schema version v${schema.schemaVersion} is newer than the CLI's v${TAP_SCHEMA_VERSION}.`)
  }

  if (schema.schemaVersion < TAP_SCHEMA_VERSION) {
    return throwTapError(errors.tapOutdatedProtocol, `schema version v${schema.schemaVersion} is older than the CLI's v${TAP_SCHEMA_VERSION}.`)
  }

  return schema
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

  if ('error' in outcome) {
    renderFailure(outcome.error)

    return 1
  }

  renderResult(outcome.result)

  return 0
}

const tapModule = {
  async start (operands: string[] = [], options: TapCliOptions = {}): Promise<number> {
    debug('tap invocation %o with options %o', operands, options)

    const { wantsHelp, positionals, command } = buildCommandInfo(operands)

    const native = tapCliCommands.find(({ name }) => name === command)

    if (native) {
      if (wantsHelp) {
        renderUsage(native.usage)

        return 0
      }

      // Native commands take no positionals, so anything past the name is excess.
      // The schema path validates through commander; this path must do it itself.
      try {
        rejectExcessArguments(native.name, [], positionals.slice(1))
      } catch (err: any) {
        if (err instanceof commander.CommanderError) {
          return 1
        }

        throw err
      }

      return native.handler(options)
    }

    try {
      const selection = await resolveInstance({ instance: options.instance, cwd: process.cwd() })

      return await withTapSession(selection.instance, async (session) => {
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
      if (err instanceof CypressInstanceError) {
        if ((wantsHelp || !command) && err.code === 'NO_INSTANCE') {
          return renderGenericHelp(wantsHelp, tapCliCommands)
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
