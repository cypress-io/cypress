import type { SerializedCommandLog, SerializedTest } from '@packages/types'
import { TapCommandError } from './commands/definition'
import { omitNullish } from './utils'

import type { TapNetworkInfo, TapReporterView } from './contract'
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

const serializeTestError = (err: Record<string, unknown>): TestError => {
  const { name, message, stack } = err as TestError

  return omitNullish({ name, message, stack })
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
const serializeCommandEntry = (command: SerializedCommandLog): CommandEntry => {
  const { id, name, message, state, type, _hasBeenCleanedUp } = command

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

export const serializeTestCommands = (attempt: SerializedTest): CommandEntry[] => {
  // The driver buckets cy.intercept registrations under `routes`, apart from
  // `commands`, but the reporter shows both interleaved in one command log.
  // Merge them back into the order the developer sees, keyed on each log's
  // creation timestamp (stable for the timestamp-less rows in synthetic input).
  const logs = [...asCommandLogs(attempt.commands), ...asCommandLogs(attempt.routes)]
  .sort((a, b) => createdAt(a) - createdAt(b))

  return logs.map(serializeCommandEntry)
}

// The display-level slice of a log's attrs the reporter panel reads beyond the
// lean CommandEntry fields.
interface ReporterLog {
  displayName?: string
  hookId?: string
  event?: boolean
  group?: string
  groupLevel?: number
}

const serializeReporterCommand = (command: SerializedCommandLog): TapReporterView['commands'][number] => {
  const { id, name, message, state, type, _hasBeenCleanedUp } = command
  const { displayName, hookId, event, group, groupLevel } = command as ReporterLog

  const displayMessage = (command.renderProps as NetworkRenderProps | undefined)?.message ?? message

  return omitNullish({
    id,
    name,
    displayName,
    message: displayMessage,
    state,
    type,
    hookId,
    // The driver defaults `event` to false on every command log; only true is signal.
    event: event === true ? true : undefined,
    group,
    groupLevel,
    network: serializeNetworkInfo(command),
    cleanedUp: _hasBeenCleanedUp === true ? true : undefined,
  })
}

const serializeReporterRoute = (log: SerializedCommandLog): TapReporterView['routes'][number] => {
  const { id } = log
  const { method, url, isStubbed, numResponses, alias, status } = log as NetworkLog

  return omitNullish({
    id,
    method,
    url,
    stubbed: isStubbed,
    status,
    numResponses,
    alias,
  })
}

const serializeReporterHooks = (test: SerializedTest, attempt: SerializedTest): TapReporterView['hooks'] => {
  // Suite-level hooks never serialize onto a test (the reporter unions them in
  // from the runnables tree), but every hook that ran left its hookId under its
  // hook name in the test's timings — derive the sections from there, in run
  // order. Non-hook timings (`lifecycle`, `test`) aren't arrays, so they drop out.
  const hooks = Object.entries(attempt.timings ?? {}).flatMap(([hookName, entries]) => {
    return Array.isArray(entries)
      ? (entries as Array<{ hookId: string }>).map(({ hookId }) => ({ hookId, hookName }))
      : []
  })

  return [
    ...hooks,
    // The test's own commands carry its id as their hookId; the reporter
    // synthesizes this same pseudo-hook to render them as the "test body".
    { hookId: test.id, hookName: 'test body' },
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

  return omitNullish({
    test: {
      id: test.id,
      title: test.title,
      fullTitle: Array.isArray(titlePath) ? titlePath.join(' > ') : test.title,
      state: attempt.state ?? unreachedState(runComplete),
    },
    hooks: serializeReporterHooks(test, attempt),
    routes: asCommandLogs(attempt.routes).map(serializeReporterRoute),
    commands: asCommandLogs(attempt.commands).map(serializeReporterCommand),
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
