import type { SerializedTest } from '@packages/types'
import { TapCommandError } from './definition'

import type { TapTestsRunner, TestDetailEntry, TestError, TestStateEntry, TestStateValue } from '../types'

export interface CommandEntry {
  id: string
  name?: string
  message?: string
  state?: string
  /** `parent` | `child` | `dual`. */
  type?: string
}

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

// A test's attempts oldest→latest. The top-level test IS the latest attempt;
// earlier ones live on prevAttempts, each carrying its own commands, state, err
// and timings.
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

// Resolve one attempt of a test. `attempt` is 1-based (attempt 1 = the first
// run), matching the reporter UI; `undefined` selects the latest attempt.
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

  return new TapCommandError('ATTEMPT_NOT_FOUND', `test "${testId}" has ${selection.attempts} attempt(s); pass --attempt 1–${selection.attempts} (defaults to the latest)`)
}

// Identity fields (id, title, fullTitle) come from the test; execution fields
// (state, duration, timings, error) come from the selected attempt.
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
  const commands = (attempt.commands ?? []) as Array<Record<string, unknown>>

  return commands.map(({ id, name, message, state, type }): CommandEntry => {
    return {
      id: id as string,
      ...(name !== undefined ? { name: name as string } : {}),
      ...(message !== undefined ? { message: message as string } : {}),
      ...(state !== undefined ? { state: state as string } : {}),
      ...(type !== undefined ? { type: type as string } : {}),
    }
  })
}

export interface RunResults {
  passed: number
  failed: number
  pending: number
  skipped: number
}

export const aggregateResults = (runner: TapTestsRunner): { results: RunResults, totalTests: number } => {
  const tests = Object.values(getAllTests(runner))
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
