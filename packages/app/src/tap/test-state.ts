import type { SerializedCommandLog, SerializedTest } from '@packages/types'
import { TapCommandError } from './commands/definition'
import { omitNullish } from './utils'

import type { TapNetworkInfo, TapReporterSpecAttempt, TapReporterSpecTest, TapReporterSpecView, TapReporterSuite, TapReporterView } from './contract'
import type { CommandEntry, TapTestsRunner, TestDetailEntry, TestError, TestStateEntry, TestStateValue } from './types'

// A test with no final status state set yet was never reached: 'pending' while
// the run is still going, 'skipped' once it is complete (matching the driver's
// end-of-run summary).
const unreachedState = (runComplete: boolean): TestStateValue => {
  return runComplete ? 'skipped' : 'pending'
}

export const serializeTestsState = (runner: TapTestsRunner): TestStateEntry[] => {
  const tests = Object.values(runner.getAllTestsState())
  const runComplete = runner.isRunComplete()

  return tests.map(({ id, title, duration, state, currentRetry }): TestStateEntry => {
    return omitNullish({
      id,
      title,
      duration,
      state: state ?? unreachedState(runComplete),
      retries: currentRetry,
    })
  })
}

// The driver serializes a runnable by copying own properties, so object values
// like `timings` are live references into its runner state — snapshot them at
// read time. The JSON round-trip covers browsers without native structuredClone.
const cloneReferenceObject = <T>(value: T): T => {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value))
}

const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)

// A test can throw a non-Error (`throw { message: 42 }`), so keep name/message/
// stack only when they're actually strings — the CLI renderer treats them as
// such (e.g. `message.split('\n')`).
const serializeTestError = (err: Record<string, unknown>): TestError => {
  const { name, message, stack } = err

  return omitNullish({ name: asString(name), message: asString(message), stack: asString(stack) })
}

const attemptsOf = (test: SerializedTest): SerializedTest[] => {
  const prev = Array.isArray(test.prevAttempts) ? test.prevAttempts : []

  return [...prev, test]
}

type AttemptSelection =
  | { test: SerializedTest, attempt: SerializedTest }
  | { error: 'TEST_NOT_FOUND' }
  | { error: 'ATTEMPT_NOT_FOUND', attempts: number }

const isAttemptInRange = (attempt: number, count: number): boolean => {
  return Number.isInteger(attempt) && attempt >= 1 && attempt <= count
}

export const selectTestAttempt = (runner: Pick<TapTestsRunner, 'getTestState'>, testId: string, attempt?: number): AttemptSelection => {
  const test = runner.getTestState(testId)

  if (!test) {
    return { error: 'TEST_NOT_FOUND' }
  }

  const attempts = attemptsOf(test)

  if (attempt === undefined) {
    return { test, attempt: attempts[attempts.length - 1] }
  }

  if (!isAttemptInRange(attempt, attempts.length)) {
    return { error: 'ATTEMPT_NOT_FOUND', attempts: attempts.length }
  }

  return { test, attempt: attempts[attempt - 1] }
}

export const attemptSelectionError = (selection: { error: 'TEST_NOT_FOUND' } | { error: 'ATTEMPT_NOT_FOUND', attempts: number }, testId: string): TapCommandError => {
  if (selection.error === 'TEST_NOT_FOUND') {
    return new TapCommandError('TEST_NOT_FOUND', `no test of this run matches the id "${testId}" — use the tests command to list this run’s tests`)
  }

  const { attempts } = selection

  const message = attempts === 1
    ? `test "${testId}" has only 1 attempt; --attempt selects an earlier attempt of a retried test`
    : `test "${testId}" has ${attempts} attempts; pass --attempt 1–${attempts} (defaults to the latest)`

  return new TapCommandError('ATTEMPT_NOT_FOUND', message)
}

export const serializeTestDetail = (test: SerializedTest, attempt: SerializedTest, runComplete: boolean): TestDetailEntry => {
  const titlePath = test._titlePath
  const { duration, state, currentRetry, timings, err } = attempt

  return omitNullish({
    id: test.id,
    title: test.title,
    fullTitle: Array.isArray(titlePath) ? titlePath.join(' > ') : test.title,
    duration,
    state: state ?? unreachedState(runComplete),
    retries: currentRetry,
    timings: timings != null ? cloneReferenceObject(timings) : undefined,
    error: err != null ? serializeTestError(err) : undefined,
  })
}

// The reporter's `renderProps` (resolved to an object by the time a log
// serializes) is where request/xhr/`cy.request` rows carry their display detail.
interface NetworkRenderProps {
  message?: string
  indicator?: TapNetworkInfo['indicator']
  status?: string | number
  wentToOrigin?: boolean
  interceptions?: unknown[]
}

// The network-relevant slice of a log's attrs. The driver types these behind an
// index signature, so name the shape we read rather than narrow each access.
interface NetworkLog {
  instrument?: string
  method?: string
  url?: string
  isStubbed?: boolean
  numResponses?: number
  alias?: string
  status?: string | number
  renderProps?: NetworkRenderProps
}

// A row is network-instrumented when it is a `cy.intercept` registration
// (instrument `route`) or a request/xhr/fetch/`cy.request` log. The latter is
// identified the way the reporter does — by the `renderProps` the proxy-logging
// and request commands attach (a status `indicator`, or the `interceptions`
// list) — rather than by name, since `cy.request` and proxy requests both log
// as `request`.
const serializeNetworkInfo = (command: SerializedCommandLog): TapNetworkInfo | undefined => {
  const { instrument, method, url, isStubbed, numResponses, alias, status, renderProps } = command as NetworkLog
  const isRouteRow = instrument === 'route'
  const isRequestRow = renderProps?.indicator != null || Array.isArray(renderProps?.interceptions)

  if (!isRouteRow && !isRequestRow) {
    return undefined
  }

  // A route row carries `isStubbed`; a request row reports the same
  // stubbed-vs-real fact as `wentToOrigin` on its renderProps.
  const stubbed = isStubbed ?? (renderProps?.wentToOrigin != null ? !renderProps.wentToOrigin : undefined)

  const info = omitNullish<TapNetworkInfo>({
    method,
    // The base log defaults `url` to the page URL, so only a route matcher or a
    // real request's URL is a trustworthy request URL — `cy.request` never
    // overrides it, keeping its URL in `message` instead.
    url: isRouteRow || Array.isArray(renderProps?.interceptions) ? url : undefined,
    indicator: renderProps?.indicator,
    status: status ?? renderProps?.status,
    stubbed,
    numResponses,
    alias,
  })

  // A memory-evicted row can trip the route/request check while every detail
  // field was nulled; drop the empty object so the contract stays absent-not-empty.
  return Object.keys(info).length ? info : undefined
}

// The driver's reduceMemory nulls (not deletes) non-preserved command attrs
// once a test falls out of numTestsKeptInMemory; omitNullish then keeps the
// wire contract's optional fields absent-not-null. Its _hasBeenCleanedUp marker
// is surfaced as `cleanedUp` so consumers can tell eviction apart from fields
// that were never set.
const serializeCommandEntry = (command: SerializedCommandLog, id: string | undefined): CommandEntry => {
  const { name, message, state, type, _hasBeenCleanedUp } = command

  // Mirror the reporter's displayed row text: network rows leave the base
  // message empty and carry their summary (e.g. `GET 200 /api`) on renderProps.
  const displayMessage = (command.renderProps as NetworkRenderProps | undefined)?.message ?? message

  return omitNullish<CommandEntry>({
    id,
    name,
    message: displayMessage,
    state,
    type,
    network: serializeNetworkInfo(command),
    cleanedUp: _hasBeenCleanedUp === true ? true : undefined,
  })
}

const asCommandLogs = (value: unknown): SerializedCommandLog[] => {
  return Array.isArray(value) ? value as SerializedCommandLog[] : []
}

const createdAt = (log: SerializedCommandLog): number => {
  return typeof log.createdAtTimestamp === 'number' ? log.createdAtTimestamp : 0
}

// The driver buckets cy.intercept registrations under `routes`, apart from
// `commands`, but the reporter shows both interleaved in one command log.
// Merge them back into the order the developer sees, keyed on each log's
// creation timestamp (stable for the timestamp-less rows in synthetic input).
const orderedAttemptLogs = (attempt: SerializedTest): SerializedCommandLog[] => {
  return [...asCommandLogs(attempt.commands), ...asCommandLogs(attempt.routes)]
  .sort((a, b) => createdAt(a) - createdAt(b))
}

const isRouteLog = (log: SerializedCommandLog): boolean => {
  return (log as NetworkLog).instrument === 'route'
}

// The reporter's numbering rule (hook-model addCommand): event and system rows
// are unnumbered annotations, everything else counts.
const isNumberedLog = (log: SerializedCommandLog): boolean => {
  const { event } = log as ReporterLog

  return event !== true && log.type !== 'system'
}

// Tap command ids reproduce the numbers the app reporter shows: a per-hook
// counter over the numbered rows (so `12` here is row 12 of that section in the
// UI), derived at read time so every command that serializes or resolves an id
// agrees by construction. The reporter leaves event/system rows unnumbered, so
// those take an attempt-wide `e1`..`eN` of their own. Keyed by the driver's log
// id. Route registrations aren't commands and stay id-less.
const tapCommandIds = (logs: SerializedCommandLog[]): Map<string, string> => {
  const ids = new Map<string, string>()
  const hookCounters = new Map<string | undefined, number>()
  let eventCount = 0

  for (const log of logs) {
    if (isRouteLog(log)) {
      continue
    }

    if (isNumberedLog(log)) {
      const { hookId } = log as ReporterLog
      const number = (hookCounters.get(hookId) ?? 0) + 1

      hookCounters.set(hookId, number)
      ids.set(log.id, String(number))
    } else {
      ids.set(log.id, `e${++eventCount}`)
    }
  }

  return ids
}

const hookIdOf = (log: SerializedCommandLog): string | undefined => (log as ReporterLog).hookId

export interface ResolvedCommand {
  logId: string
  entry: CommandEntry
}

// Matches a displayed command id to its underlying log. The id is a row's
// number as the reporter shows it (`12` or the event rows' `e3`), optionally
// qualified with its hook section (`h1:12`) since the numbers restart per
// section. A plain number prefers the test body, then a unique match anywhere;
// a remaining tie is ambiguous rather than silently guessed.
const findCommandLog = (attempt: SerializedTest, logs: SerializedCommandLog[], ids: Map<string, string>, tapId: string, testId: string): SerializedCommandLog | undefined => {
  const colon = tapId.indexOf(':')
  const hookQualifier = colon === -1 ? undefined : tapId.slice(0, colon)
  const rowId = colon === -1 ? tapId : tapId.slice(colon + 1)

  const candidates = logs.filter((log) => {
    return ids.get(log.id) === rowId && (hookQualifier === undefined || hookIdOf(log) === hookQualifier)
  })

  if (candidates.length <= 1) {
    return candidates[0]
  }

  const testBody = candidates.find((log) => hookIdOf(log) === testId)

  if (testBody) {
    return testBody
  }

  const hookNames = new Map(attemptHooks(attempt).map(({ hookId, hookName }) => [hookId, hookName]))
  const qualified = candidates.map((log) => {
    const hookId = hookIdOf(log)
    const hookName = hookId != null ? hookNames.get(hookId) : undefined

    return `${hookId}:${rowId}${hookName ? ` (${hookName})` : ''}`
  })

  throw new TapCommandError('AMBIGUOUS_COMMAND', `"${tapId}" matches ${qualified.join(' and ')} — qualify the id with its section, e.g. "${qualified[0].split(' ')[0]}"`)
}

/**
 * Resolves a command id the way the reporter shows it — a row number, an
 * e-prefixed event id, or a hook-qualified `h1:3` — to the driver log id the
 * runner keys on plus the serialized entry to display. The one command-id
 * lookup the `command` and `pin` commands share, so both accept exactly the
 * ids the reporter emits.
 */
export const resolveCommand = (attempt: SerializedTest, tapId: string, testId: string): ResolvedCommand | undefined => {
  const logs = orderedAttemptLogs(attempt)
  const ids = tapCommandIds(logs)
  const log = findCommandLog(attempt, logs, ids, tapId, testId)

  return log ? { logId: log.id, entry: serializeCommandEntry(log, ids.get(log.id)) } : undefined
}

export const resolveCommandLogId = (attempt: SerializedTest, tapId: string, testId: string): string | undefined => {
  return resolveCommand(attempt, tapId, testId)?.logId
}

export const serializeTestCommands = (attempt: SerializedTest): CommandEntry[] => {
  const logs = orderedAttemptLogs(attempt)
  const ids = tapCommandIds(logs)

  return logs.map((log) => serializeCommandEntry(log, ids.get(log.id)))
}

// The display-level slice of a log's attrs the reporter panel reads beyond the
// lean CommandEntry fields.
interface ReporterLog {
  displayName?: string
  hookId?: string
  event?: boolean
  group?: string
  groupLevel?: number
  alias?: string | string[]
  aliasType?: string
  referencesAlias?: { name: string } | Array<{ name: string }>
  sessionInfo?: { id?: string, isGlobalSession?: boolean, status?: string }
  functionName?: string
  callCount?: number
}

const asArray = <T>(value: T | T[] | undefined): T[] | undefined => {
  if (value == null) {
    return undefined
  }

  const array = Array.isArray(value) ? value : [value]

  return array.length ? array : undefined
}

const serializeReporterCommand = (command: SerializedCommandLog, ids: Map<string, string>): TapReporterView['commands'][number] => {
  const { name, message, state, type, _hasBeenCleanedUp } = command
  const { displayName, hookId, event, group, groupLevel, alias, aliasType, referencesAlias } = command as ReporterLog

  const displayMessage = (command.renderProps as NetworkRenderProps | undefined)?.message ?? message

  return omitNullish({
    id: ids.get(command.id) as string,
    name,
    displayName,
    message: displayMessage,
    state,
    type,
    hookId,
    // The driver defaults `event` to false on every command log; only true is signal.
    event: event === true ? true : undefined,
    // The driver's `group` holds the enclosing group command's log id — remap it
    // into the same tap id space the rows use.
    group: group != null ? ids.get(group) : undefined,
    groupLevel,
    aliases: asArray(alias),
    aliasType,
    referencedAliases: asArray(referencesAlias)?.map((ref) => ref.name),
    network: serializeNetworkInfo(command),
    cleanedUp: _hasBeenCleanedUp === true ? true : undefined,
  })
}

const serializeReporterAgent = (log: SerializedCommandLog): TapReporterView['agents'][number] => {
  const { name } = log
  const { functionName, alias, callCount } = log as ReporterLog

  return omitNullish({
    type: name,
    functionName,
    aliases: asArray(alias),
    callCount,
  })
}

// The reporter's SESSIONS panel isn't fed by an instrument of its own — a
// `cy.session` group log is an ordinary command carrying `sessionInfo`, and
// each such log is one panel row.
const serializeReporterSessions = (logs: SerializedCommandLog[]): TapReporterView['sessions'] => {
  return logs.flatMap((log) => {
    const { sessionInfo } = log as ReporterLog

    if (sessionInfo?.id == null) {
      return []
    }

    return [omitNullish<TapReporterView['sessions'][number]>({
      name: sessionInfo.id,
      status: sessionInfo.status,
      global: sessionInfo.isGlobalSession === true ? true : undefined,
    })]
  })
}

const serializeReporterRoute = (log: SerializedCommandLog): TapReporterView['routes'][number] => {
  const { method, url, isStubbed, numResponses, alias, status } = log as NetworkLog

  return omitNullish({
    method,
    url,
    stubbed: isStubbed,
    status,
    numResponses,
    alias,
  })
}

// Suite-level hooks never serialize onto a test (the reporter unions them in
// from the runnables tree), but every hook that ran left its hookId under its
// hook name in the test's timings — derive the sections from there, in run
// order. Non-hook timings (`lifecycle`, `test`) aren't arrays, so they drop out.
const attemptHooks = (attempt: SerializedTest): TapReporterView['hooks'] => {
  return Object.entries(attempt.timings ?? {}).flatMap(([hookName, entries]) => {
    return Array.isArray(entries)
      ? (entries as Array<{ hookId: string }>).map(({ hookId }) => ({ hookId, hookName }))
      : []
  })
}

const serializeReporterHooks = (test: SerializedTest, attempt: SerializedTest): TapReporterView['hooks'] => {
  const hooks = attemptHooks(attempt)
  // The test body runs after the `before` hooks and before the `after` hooks,
  // so splice it into that slot to keep `hooks` in run order. The test's own
  // commands carry its id as their hookId; the reporter synthesizes this same
  // pseudo-hook to render them as the "test body".
  const firstAfter = hooks.findIndex(({ hookName }) => hookName.startsWith('after'))
  const at = firstAfter === -1 ? hooks.length : firstAfter

  return [
    ...hooks.slice(0, at),
    { hookId: test.id, hookName: 'test body' },
    ...hooks.slice(at),
  ]
}

const serializeReporterError = (err: Record<string, unknown>): TapReporterView['error'] => {
  const { codeFrame } = err as { codeFrame?: { relativeFile?: string, line?: number, column?: number, frame?: string } }

  return omitNullish({
    ...serializeTestError(err),
    codeFrame: codeFrame != null
      ? omitNullish({ file: codeFrame.relativeFile, line: codeFrame.line, column: codeFrame.column, frame: codeFrame.frame })
      : undefined,
  })
}

/**
 * Everything the open-mode reporter renders for one test attempt: the ROUTES
 * table (`cy.intercept` registrations, which the driver buckets under `routes`),
 * the hook sections, the command log with its display-level fields
 * (hook membership, event flag, grouping, network detail), and — when the
 * attempt failed — the error panel with its code frame.
 */
export const serializeReporterView = (test: SerializedTest, attempt: SerializedTest, runComplete: boolean): TapReporterView => {
  const titlePath = test._titlePath
  // Splitting the canonical order back apart (rather than mapping the driver's
  // buckets directly) keeps the tap ids ascending within each list.
  const logs = orderedAttemptLogs(attempt)
  const ids = tapCommandIds(logs)

  return omitNullish({
    test: {
      id: test.id,
      title: test.title,
      fullTitle: Array.isArray(titlePath) ? titlePath.join(' > ') : test.title,
      state: attempt.state ?? unreachedState(runComplete),
    },
    hooks: serializeReporterHooks(test, attempt),
    sessions: serializeReporterSessions(logs),
    agents: asCommandLogs(attempt.agents).map(serializeReporterAgent),
    routes: logs.filter(isRouteLog).map(serializeReporterRoute),
    commands: logs.filter((log) => !isRouteLog(log)).map((log) => serializeReporterCommand(log, ids)),
    error: attempt.err != null ? serializeReporterError(attempt.err) : undefined,
  })
}

export interface RunResults {
  passed: number
  failed: number
  pending: number
  skipped: number
}

export const aggregateResults = (runner: TapTestsRunner): { results: RunResults, totalTests: number } => {
  const tests = Object.values(runner.getAllTestsState())
  const runComplete = runner.isRunComplete()
  const results: RunResults = { passed: 0, failed: 0, pending: 0, skipped: 0 }

  for (const test of tests) {
    const state = test.state ?? unreachedState(runComplete)

    if (state === 'passed') {
      results.passed++
    } else if (state === 'failed') {
      results.failed++
    } else if (state === 'pending') {
      results.pending++
    } else {
      results.skipped++
    }
  }

  return { results, totalTests: tests.length }
}

const suitePathOf = (test: SerializedTest): string[] => {
  return Array.isArray(test._titlePath) ? test._titlePath.slice(0, -1) : []
}

// The driver stores no run end time (the reporter freezes its own clock), so a
// completed run's wall clock ends at the last test's recorded end.
const testEndMs = (test: SerializedTest): number | undefined => {
  const { wallClockStartedAt, wallClockDuration } = test as { wallClockStartedAt?: string, wallClockDuration?: number }

  return wallClockStartedAt != null ? new Date(wallClockStartedAt).getTime() + (wallClockDuration ?? 0) : undefined
}

const runDuration = (runner: TapTestsRunner, tests: SerializedTest[]): number | undefined => {
  const startTime = runner.getStartTime()

  if (startTime == null) {
    return undefined
  }

  const start = new Date(startTime).getTime()

  if (!runner.isRunComplete()) {
    return Date.now() - start
  }

  const ends = tests.map(testEndMs).filter((end): end is number => end != null)

  return ends.length ? Math.max(...ends) - start : undefined
}

const serializeSpecAttempts = (test: SerializedTest, runComplete: boolean): TapReporterSpecAttempt[] | undefined => {
  const attempts = attemptsOf(test)

  if (attempts.length < 2) {
    return undefined
  }

  return attempts.map((attempt, index) => {
    return omitNullish({
      attempt: index + 1,
      state: attempt.state ?? unreachedState(runComplete),
      duration: attempt.duration,
    })
  })
}

const serializeSpecTest = (test: SerializedTest, runComplete: boolean): TapReporterSpecTest => {
  return omitNullish({
    id: test.id,
    title: test.title,
    state: test.state ?? unreachedState(runComplete),
    duration: test.duration,
    retries: test.currentRetry,
    attempts: serializeSpecAttempts(test, runComplete),
  })
}

/**
 * The spec-level overview the app reporter shows above any single test: the
 * header stats, the root-level tests, and one flattened suite section per
 * suite path with direct tests — nesting lives in the joined title, matching
 * how the CLI displays the sections. Each test's `_titlePath` names its suite
 * path; the flat test list is in document order, so grouping by first
 * appearance reproduces the reporter's section order.
 */
export const serializeReporterSpecView = (runner: TapTestsRunner, spec: string | undefined): TapReporterSpecView => {
  const tests = Object.values(runner.getAllTestsState())
  const runComplete = runner.isRunComplete()
  const rootTests: TapReporterSpecTest[] = []
  const suites = new Map<string, TapReporterSuite>()

  for (const test of tests) {
    const path = suitePathOf(test)

    if (!path.length) {
      rootTests.push(serializeSpecTest(test, runComplete))
      continue
    }

    const title = path.join(' > ')
    const suite = suites.get(title) ?? { title, tests: [] }

    suites.set(title, suite)
    suite.tests.push(serializeSpecTest(test, runComplete))
  }

  const { results } = aggregateResults(runner)

  return omitNullish({
    spec,
    stats: omitNullish({ ...results, duration: runDuration(runner, tests) }),
    tests: rootTests,
    suites: [...suites.values()],
  })
}
