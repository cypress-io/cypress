import type { SerializedTest } from '@packages/types'

// Optional fields throughout are absent rather than null: JSON drops undefined
// keys at the CDP boundary, so the in-memory shape already equals the wire form.

export type TestStateValue = 'passed' | 'failed' | 'pending' | 'skipped'

export interface TestStateEntry {
  id: string
  title: string
  duration?: number
  state: TestStateValue
  /** Retries actually taken this run, not the configured maximum. */
  retries?: number
}

export interface TestError {
  name?: string
  message?: string
  stack?: string
}

export interface TestDetailEntry {
  id: string
  title: string
  /** Suite titles leading to this test plus its own, joined with ` > `. */
  fullTitle: string
  duration?: number
  state: TestStateValue
  retries?: number
  timings?: Record<string, unknown>
  error?: TestError
}

/**
 * `getTestsState(testId)` serializes the run's tests up to (excluding) the one
 * whose id matches, so a never-matching sentinel yields every test.
 */
export interface TapTestsRunner {
  getTestsState (testId?: string): Record<string, SerializedTest>
}

/**
 * Seam over the driver runner the tap commands read (component tests stub it).
 * The instance comes from the event manager, not `window.Cypress`: when the
 * runner page is itself an AUT (cypress-in-cypress), `window.Cypress` is the
 * outer driver injected into it, while the event manager only holds this app's.
 */
export const tapRunnerSource = {
  getRunner (): TapTestsRunner | undefined {
    try {
      // Both a throw and undefined here mean there is no run to read yet.
      return window.getEventManager?.().getCypress()?.runner
    } catch {
      return undefined
    }
  },
}

export const serializeTestsState = (runner: TapTestsRunner): TestStateEntry[] => {
  // '__never__' matches no id, so every test is serialized (see TapTestsRunner).
  const tests = Object.values(runner.getTestsState('__never__'))

  return tests.map(({ id, title, duration, state, currentRetry }): TestStateEntry => {
    return {
      id,
      title,
      ...(duration !== undefined ? { duration } : {}),
      // The driver marks `it.skip` tests 'pending' explicitly (mocha `pending`
      // event), so a state-less test was never reached — 'skipped', matching
      // the driver's own run summary.
      state: state ?? 'skipped',
      ...(currentRetry !== undefined ? { retries: currentRetry } : {}),
    }
  })
}

// The driver's `wrapErr` copies these props verbatim from whatever the user
// threw, so a non-Error throw can put non-strings here — narrow, don't cast.
const serializeTestError = (err: Record<string, unknown>): TestError => {
  const { name, message, stack } = err

  return {
    ...(typeof name === 'string' ? { name } : {}),
    ...(typeof message === 'string' ? { message } : {}),
    ...(typeof stack === 'string' ? { stack } : {}),
  }
}

export const serializeTestDetail = (runner: TapTestsRunner, testId: string): TestDetailEntry | undefined => {
  // Pass the sentinel, not testId: getTestsState excludes the matching id, so
  // the wanted test would never be in the result (see TapTestsRunner).
  const test = runner.getTestsState('__never__')[testId]

  if (!test) {
    return undefined
  }

  const { id, title, duration, state, currentRetry, timings, err } = test
  const titlePath = test._titlePath

  return {
    id,
    title,
    fullTitle: Array.isArray(titlePath) ? titlePath.join(' > ') : title,
    ...(duration !== undefined ? { duration } : {}),
    state: state ?? 'skipped',
    ...(currentRetry !== undefined ? { retries: currentRetry } : {}),
    // The driver's serialization shallow-copies the runnable, so `timings` is a
    // live reference into its test object — JSON-clone to return a snapshot
    // (which is also exactly the wire form).
    ...(timings != null ? { timings: JSON.parse(JSON.stringify(timings)) } : {}),
    ...(err != null ? { error: serializeTestError(err) } : {}),
  }
}
