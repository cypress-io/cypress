import Debug from 'debug'
import commander from 'commander'

import { CypressInstanceError, resolveInstance } from '../cypress-instances'
import { withTapSession, throwTapError, validateExecResult } from '../tap/tap-session'
import type { TapSession } from '../tap/tap-session'
import { buildTapProgram, buildNativeProgram } from '../tap/build-program'
import { renderFailure, renderKnownFailure, renderOutcome, renderSchemaHelp, renderStaticHelp, renderNativeHelp } from '../tap/output'
import { tapCliCommands } from '../tap/commands'
import { beginTapTrace, noteTapCommand, noteTapFailure, recordTapEvent } from '../tap/events'
import { renderOptionsFor } from '../tap/render'
import type { TapCliCommand, TapCliOptions } from '../tap/types'
import { TAP_COMMANDS, TAP_EXEC_METHOD, TAP_SCHEMA_VERSION, TAP_SCHEMA_METHOD, buildTapSchema } from '@packages/cypress-instances'
import type { TapCommandOptionSchema, TapSchema } from '@packages/cypress-instances'
import util from '../util'
import { errors } from '../errors'

const debug = Debug('cypress:cli:tap')

const INVALID_USAGE = 'INVALID_USAGE'
const UNHANDLED = 'UNHANDLED'

const knownCommands = new Set<string>([
  ...tapCliCommands.map(({ name }) => name),
  ...TAP_COMMANDS.map(({ name }) => name),
])

// A name this CLI does not know is whatever the user typed, so it is reported
// as unknown rather than sent verbatim.
const reportedCommand = (command: string | undefined): string => {
  if (!command) {
    return 'none'
  }

  return knownCommands.has(command) ? command : 'unknown'
}

const declaredOptions: readonly TapCommandOptionSchema[] = [...tapCliCommands, ...TAP_COMMANDS].flatMap(({ name, options = [] }) => {
  return [...options, ...renderOptionsFor(name)]
})

// Both spellings of every option resolve to the canonical name, so `-b` and
// `--browser` report as one flag.
const knownFlags = new Map<string, string>([
  ...['instance', 'json', 'timeout', 'help'].map((name): [string, string] => [name, name]),
  ['h', 'help'],
  ...declaredOptions.flatMap(({ name, alias }): [string, string][] => alias ? [[name, name], [alias, name]] : [[name, name]]),
])

// Names only: an option's value carries selectors, spec paths and test titles.
// An undeclared flag is whatever the user typed, so it reports as unknown.
// --instance/--json/--timeout are parsed off by the outer `cypress tap` command
// and never reach the operands, so they are read from the options it passes on.
const reportedFlags = (operands: string[], options: TapCliOptions): string[] => {
  const named = operands
  .filter((operand) => operand.startsWith('-'))
  .map((operand) => knownFlags.get(operand.replace(/^-+/, '').split('=')[0]) ?? 'unknown')

  const topLevel = Object.entries(options).filter(([, value]) => value !== undefined).map(([name]) => name)

  return [...new Set([...named, ...topLevel])]
}

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
      noteTapFailure(INVALID_USAGE)

      return 1
    }

    throw err
  }

  return dispatchCode ?? 1
}

const execCommand = async (session: TapSession, command: string, commandArgs: Record<string, string>, commandOptions: Record<string, string>, json: boolean | undefined, renderOptions: Record<string, string>): Promise<number> => {
  const outcome = validateExecResult(await session.call(TAP_EXEC_METHOD, [command, commandArgs, commandOptions]))

  if ('error' in outcome) {
    renderFailure(outcome.error)

    return 1
  }

  // The rendering reads both: the options that shaped the result and the ones
  // that only shape its view.
  renderOutcome(command, outcome.result, json, { ...commandOptions, ...renderOptions })

  return 0
}

// With no instance to query, fall back to the schema this CLI ships with so the
// help listing still reflects every command the CLI knows — the query path stays
// authoritative when an instance is attached (it may run a different version).
const renderKnownSchema = (command: string | undefined): number => {
  const schema = buildTapSchema(util.pkgVersion())
  const program = buildTapProgram(schema, () => {})

  return renderStaticHelp(program, schema, command)
}

const runTap = async ({ wantsHelp, positionals, command }: CommandInfo, options: TapCliOptions): Promise<number> => {
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
        noteTapCommand(name)
        dispatchCode = await execCommand(session, name, args, withJson(schema, name, commandOptions, options.json), options.json, renderOptions)
      })

      if (wantsHelp || !command) {
        return renderSchemaHelp(program, schema, selection, command)
      }

      try {
        await program.parseAsync(positionals, { from: 'user' })
      } catch (err: any) {
        if (err instanceof commander.CommanderError) {
          noteTapFailure(INVALID_USAGE)

          return 1
        }

        throw err
      }

      return dispatchCode
    }, options.timeout)
  } catch (err: any) {
    if (err instanceof CypressInstanceError) {
      if (wantsHelp || !command) {
        return renderKnownSchema(command)
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
}

const tapModule = {
  async start (operands: string[] = [], options: TapCliOptions = {}): Promise<number> {
    debug('tap invocation %o with options %o', operands, options)

    const info = buildCommandInfo(operands)
    const startedAt = Date.now()
    let exitCode = 1

    beginTapTrace(reportedCommand(info.command), reportedFlags(operands, options))

    // The CLI exits the moment this returns, so the event is reported before it
    // does rather than left in flight.
    try {
      exitCode = await runTap(info, options)

      return exitCode
    } catch (err: any) {
      noteTapFailure(UNHANDLED)

      throw err
    } finally {
      await recordTapEvent(exitCode, Date.now() - startedAt)
    }
  },
}

export default tapModule
