import type { SerializedTest } from '@packages/types'
import { TapCommandError } from './definition'

import type { CommandEntry, TapTestsRunner, TestDetailEntry, TestError, TestStateEntry, TestStateValue } from '../types'

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
    return {
      id,
      title,
      ...(duration !== undefined ? { duration } : {}),
      state: state ?? unreachedState(runComplete),
      ...(currentRetry !== undefined ? { retries: currentRetry } : {}),
    }
  })
}

// The driver serializes a runnable by copying own properties, so object values
// like `timings` are live references into its runner state — snapshot them at
// read time. The JSON round-trip covers browsers without native structuredClone.
const cloneReferenceObject = <T>(value: T): T => {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value))
}

const serializeTestError = (err: Record<string, unknown>): TestError => {
  const { name, message, stack } = err

  return {
    ...(typeof name === 'string' ? { name } : {}),
    ...(typeof message === 'string' ? { message } : {}),
    ...(typeof stack === 'string' ? { stack } : {}),
  }
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

  return {
    id: test.id,
    title: test.title,
    fullTitle: Array.isArray(titlePath) ? titlePath.join(' > ') : test.title,
    ...(duration !== undefined ? { duration } : {}),
    state: state ?? unreachedState(runComplete),
    ...(currentRetry !== undefined ? { retries: currentRetry } : {}),
    ...(timings != null ? { timings: cloneReferenceObject(timings) } : {}),
    ...(err != null ? { error: serializeTestError(err) } : {}),
  }
}

export const serializeTestCommands = (attempt: SerializedTest): CommandEntry[] => {
  const commands = attempt.commands ?? []

  // The driver's reduceMemory nulls (not deletes) non-preserved command attrs
  // once a test falls out of numTestsKeptInMemory, so treat null as absent to
  // keep the wire contract's optional fields absent-not-null. Its
  // _hasBeenCleanedUp marker is surfaced as `cleanedUp` so consumers can tell
  // eviction apart from fields that were never set.
  return commands.map(({ id, name, message, state, type, _hasBeenCleanedUp }): CommandEntry => {
    return {
      id,
      ...(name != null ? { name } : {}),
      ...(message != null ? { message } : {}),
      ...(state != null ? { state } : {}),
      ...(type != null ? { type } : {}),
      ...(_hasBeenCleanedUp === true ? { cleanedUp: true } : {}),
    }
  })
}

/**
 * The active run's test counts, bucketed by outcome — the rollup a tap caller
 * needs to follow run progress at a glance. Every bucket is always a number
 * (0 when empty), so the result already equals its JSON wire form. A test that
 * has not run yet has no `state` and counts as `pending`, matching how
 * `serializeTestsState` defaults it.
 */
export interface RunResults {
  passed: number
  failed: number
  pending: number
  skipped: number
}

/**
 * Fold every test of the run into its outcome counts plus the total. Reads the
 * same `getTestsState('__never__')` snapshot the `tests` command serializes, so
 * the rollup and the per-test list can never disagree.
 */
export const aggregateResults = (runner: TapTestsRunner): { results: RunResults, totalTests: number } => {
  const tests = Object.values(runner.getTestsState('__never__'))
  const results: RunResults = { passed: 0, failed: 0, pending: 0, skipped: 0 }

  for (const test of tests) {
    // The serialized type enumerates only passed/failed/pending, but the driver
    // also marks tests 'skipped' at runtime, so widen before comparing.
    const state = test.state as string | undefined

    if (state === 'passed') {
      results.passed++
    } else if (state === 'failed') {
      results.failed++
    } else if (state === 'skipped') {
      results.skipped++
    } else {
      // No state yet (not run) or an explicit 'pending' both count as pending,
      // matching serializeTestsState's default.
      results.pending++
    }
  }

  return { results, totalTests: tests.length }
}
