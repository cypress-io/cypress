import Debug from 'debug'
import commander from 'commander'

import { isTapError, resolveInstance } from '../cypress-instances'
import { withTapSession, throwTapError, validateExecResult } from '../tap/tap-session'
import type { TapSession } from '../tap/tap-session'
import { buildTapProgram, buildNativeProgram } from '../tap/build-program'
import { renderOutcome, renderSchemaHelp, renderStaticHelp, renderNativeHelp, renderTapFailure } from '../tap/output'
import { tapCliCommands } from '../tap/commands'
import type { TapCliCommand, TapCliOptions } from '../tap/types'
import { TAP_EXEC_METHOD, TAP_SCHEMA_VERSION, TAP_SCHEMA_METHOD, buildTapSchema } from '@packages/cypress-instances'
import type { TapSchema } from '@packages/cypress-instances'
import util from '../util'
import { errors } from '../errors'

const debug = Debug('cypress:cli:tap')

// The failures that mean no instance was reachable to ask. Help is answerable
// without one, so these — and only these — lose to a help invocation.
const DISCOVERY_CODES: ReadonlySet<string> = new Set([
  'NO_INSTANCE',
  'STALE_INSTANCE',
  'NO_BROWSER_ATTACHED',
  'RENDERER_UNRESPONSIVE',
])

const validateSchema = (value: unknown): TapSchema => {
  const schema = value as TapSchema | null | undefined

  if (!schema || typeof schema !== 'object' || typeof schema.schemaVersion !== 'number' || !Array.isArray(schema.commands)) {
    return throwTapError('PROTOCOL_MISMATCH', `${TAP_SCHEMA_METHOD} returned an unrecognizable schema.`)
  }

  if (schema.schemaVersion > TAP_SCHEMA_VERSION) {
    return throwTapError('CLI_OUTDATED', `schema version v${schema.schemaVersion} is newer than the CLI's v${TAP_SCHEMA_VERSION}.`)
  }

  if (schema.schemaVersion < TAP_SCHEMA_VERSION) {
    return throwTapError('INSTANCE_OUTDATED', `schema version v${schema.schemaVersion} is older than the CLI's v${TAP_SCHEMA_VERSION}.`)
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

// `--json` is parsed by the outer `cypress tap` command, so commander never
// routes it to the command being run. A command that declares it in its own
// schema needs it anyway — for that command the flag also changes what the
// instance returns, not just how the CLI prints it — so it is handed over here.
const withJson = (schema: TapSchema, name: string, options: Record<string, string>, json: boolean | undefined): Record<string, string> => {
  const declared = schema.commands.find((command) => command.name === name)?.options.some((option) => option.name === 'json')

  return json && declared ? { ...options, json: 'true' } : options
}

const runNativeCommand = async (native: TapCliCommand, positionals: string[], options: TapCliOptions, wantsHelp: boolean): Promise<number> => {
  let dispatchCode: number | undefined
  const program = buildNativeProgram(native, async (_name, args, commandOptions) => {
    dispatchCode = await native.handler(options, args, commandOptions)
  })

  if (wantsHelp) {
    renderNativeHelp(program, native.name)

    return 0
  }

  try {
    await program.parseAsync(positionals, { from: 'user' })
  } catch (err: any) {
    if (err instanceof commander.CommanderError) {
      return 1
    }

    throw err
  }

  return dispatchCode ?? 1
}

const execCommand = async (session: TapSession, command: string, commandArgs: Record<string, string>, commandOptions: Record<string, string>, json: boolean | undefined, renderOptions: Record<string, string>): Promise<number> => {
  const outcome = validateExecResult(await session.call(TAP_EXEC_METHOD, [command, commandArgs, commandOptions]))

  if ('error' in outcome) {
    return await renderTapFailure(outcome.error)
  }

  // The rendering reads both: the options that shaped the result and the ones
  // that only shape its view.
  renderOutcome(command, outcome.result, json, { ...commandOptions, ...renderOptions })

  return 0
}

// With no instance to query, fall back to the schema this CLI ships with so the
// help listing still reflects every command the CLI knows — the query path stays
// authoritative when an instance is attached (it may run a different version).
const renderKnownSchema = (command: string | undefined): Promise<number> => {
  const schema = buildTapSchema(util.pkgVersion())
  const program = buildTapProgram(schema, () => {})

  return renderStaticHelp(program, schema, command)
}

const tapModule = {
  async start (operands: string[] = [], options: TapCliOptions = {}): Promise<number> {
    debug('tap invocation %o with options %o', operands, options)

    const { wantsHelp, positionals, command } = buildCommandInfo(operands)

    const native = tapCliCommands.find(({ name }) => name === command)

    if (native) {
      return runNativeCommand(native, positionals, options, wantsHelp)
    }

    try {
      const selection = await resolveInstance({ instance: options.instance, cwd: process.cwd() })

      return await withTapSession(selection.instance, async (session) => {
        const schema = validateSchema(await session.call(TAP_SCHEMA_METHOD))

        let dispatchCode = 0
        const program = buildTapProgram(schema, async (name, args, commandOptions, renderOptions) => {
          dispatchCode = await execCommand(session, name, args, withJson(schema, name, commandOptions, options.json), options.json, renderOptions)
        })

        if (wantsHelp || !command) {
          return renderSchemaHelp(program, schema, selection, command)
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
      }, options.timeout)
    } catch (err: any) {
      // Help is answerable without an instance, so a discovery failure falls back
      // to the schema the CLI ships with rather than reporting the failure.
      if (isTapError(err) && DISCOVERY_CODES.has(err.code) && (wantsHelp || !command)) {
        return await renderKnownSchema(command)
      }

      debug('tap %s failed: %s %s', command || '(help)', err.code, err.message)

      return await renderTapFailure(err)
    }
  },
}

export default tapModule
