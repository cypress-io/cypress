import type { SerializedTest } from '@packages/types'

import type { TapTestsRunner, TestDetailEntry, TestError, TestStateEntry, TestStateValue } from '../types'

/**
 * One command-log entry of a test, trimmed to the fields a tap caller needs to
 * follow what a test did — the reporter's command list. Optional fields are
 * absent (never `null` — JSON drops `undefined` keys at the CDP boundary) when
 * the serialized log did not carry them.
 */
export interface CommandEntry {
  id: string
  /** Command name, e.g. `visit`, `get`, `click`. */
  name?: string
  /** The command's argument summary, e.g. the URL, selector, or assertion text. */
  message?: string
  /** `passed` | `failed` | `pending` once the command has settled. */
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

export const serializeTestDetail = (test: SerializedTest, runComplete: boolean): TestDetailEntry => {
  const { id, title, duration, state, currentRetry, timings, err } = test
  const titlePath = test._titlePath

  return {
    id,
    title,
    fullTitle: Array.isArray(titlePath) ? titlePath.join(' > ') : title,
    ...(duration !== undefined ? { duration } : {}),
    state: state ?? unreachedState(runComplete),
    ...(currentRetry !== undefined ? { retries: currentRetry } : {}),
    ...(timings != null ? { timings: cloneReferenceObject(timings) } : {}),
    ...(err != null ? { error: serializeTestError(err) } : {}),
  }
}

/**
 * Serialize the command log of one test into lean, JSON-clean entries.
 * Returns `undefined` when no test of the run has that id (the command turns
 * this into a `testNotFound` result); a known test that has not run yet has no
 * command log, which serializes to an empty array, not a failure.
 */
export const serializeTestCommands = (runner: TapTestsRunner, testId: string): CommandEntry[] | undefined => {
  const test = runner.getAllTestsState()[testId]

  if (!test) {
    return undefined
  }

  // `commands` is one of the serialized RUNNABLE_LOGS; it is absent until the
  // test runs and is otherwise an array of serialized command logs.
  const commands = (test.commands ?? []) as Array<Record<string, unknown>>

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
