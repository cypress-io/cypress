import Debug from 'debug'
import commander from 'commander'

import { isTapError, resolveInstance } from '../cypress-instances'
import { withTapSession, throwTapError, validateExecResult } from '../tap/tap-session'
import type { TapSession } from '../tap/tap-session'
import { buildTapProgram, buildNativeProgram } from '../tap/build-program'
import { renderOutcome, renderSchemaHelp, renderStaticHelp, renderNativeHelp, renderTapFailure, helpFor } from '../tap/output'
import { tapCliCommands } from '../tap/commands'
import { beginTapTrace, noteTapCommand, noteTapFailure, reportTapTrace } from '../tap/events'
import { reportedInvocation } from '../tap/reported-invocation'
import type { TapCliCommand, TapCliOptions } from '../tap/types'
import { TAP_EXEC_METHOD, TAP_SCHEMA_VERSION, TAP_SCHEMA_METHOD, VersionSkewTapError, buildTapSchema } from '@packages/cypress-instances'
import type { TapSchema } from '@packages/cypress-instances'
import util from '../util'

const debug = Debug('cypress:cli:tap')

// The failures that mean no instance was reachable to ask. Help is answerable
// without one, so these — and only these — lose to a help invocation.
const DISCOVERY_CODES: ReadonlySet<string> = new Set([
  'NO_INSTANCE',
  'INSTANCE_NOT_FOUND',
  'STALE_INSTANCE',
  'NO_BROWSER_ATTACHED',
  'RENDERER_UNRESPONSIVE',
])

const INVALID_USAGE = 'INVALID_USAGE'

const validateSchema = (value: unknown): TapSchema => {
  const schema = value as TapSchema | null | undefined

  if (!schema || typeof schema !== 'object' || typeof schema.schemaVersion !== 'number' || !Array.isArray(schema.commands)) {
    return throwTapError('PROTOCOL_MISMATCH', `${TAP_SCHEMA_METHOD} returned an unrecognizable schema.`)
  }

  if (schema.schemaVersion !== TAP_SCHEMA_VERSION) {
    throw new VersionSkewTapError({
      instanceSchema: schema.schemaVersion,
      cliSchema: TAP_SCHEMA_VERSION,
      instanceCypress: schema.cypressVersion,
      cliCypress: util.pkgVersion(),
    })
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
  const program = buildNativeProgram(native, async (name, args, commandOptions) => {
    noteTapCommand(name, args, commandOptions)
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

    // A command that reads its own options before resolving an instance — as the
    // AUT readers do, so a bad value is answered as itself — raises outside the
    // flow that renders the rest of its failures.
    return await renderTapFailure(err, helpFor(program, native.name))
  }

  return dispatchCode ?? 1
}

const execCommand = async (session: TapSession, command: string, commandArgs: Record<string, string>, commandOptions: Record<string, string>, json: boolean | undefined, help: string): Promise<number> => {
  const outcome = validateExecResult(await session.call(TAP_EXEC_METHOD, [command, commandArgs, commandOptions]))

  if ('error' in outcome) {
    return await renderTapFailure(outcome.error, help)
  }

  renderOutcome(command, outcome.result, json, commandOptions)

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
      const program: commander.Command = buildTapProgram(schema, async (name, args, commandOptions) => {
        noteTapCommand(name, args, commandOptions)
        dispatchCode = await execCommand(session, name, args, withJson(schema, name, commandOptions, options.json), options.json, helpFor(program, name))
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

        // A name or flag commander could not place is answered here, where the
        // program that knows the real ones is still in scope to list them.
        if (isTapError(err)) {
          return await renderTapFailure(err, helpFor(program, command))
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
}

const tapModule = {
  async start (operands: string[] = [], options: TapCliOptions = {}): Promise<number> {
    debug('tap invocation %o with options %o', operands, options)

    const info = buildCommandInfo(operands)
    let exitCode = 1

    beginTapTrace(reportedInvocation(info.command, info.wantsHelp, options))

    // The CLI exits the moment this returns, so the trace is reported before it
    // does rather than left in flight.
    try {
      exitCode = await runTap(info, options)

      return exitCode
    } finally {
      await reportTapTrace(exitCode)
    }
  },
}

export default tapModule
