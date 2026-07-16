import type { SerializedTest } from '@packages/types'

import type { TapTestsRunner, TestDetailEntry, TestError, TestStateEntry, TestStateValue } from '../types'

// A state-less test was never reached: 'pending' while the run is still going,
// 'skipped' once it is complete (matching the driver's end-of-run summary).
const unreachedState = (runComplete: boolean): TestStateValue => {
  return runComplete ? 'skipped' : 'pending'
}

export const serializeTestsState = (runner: TapTestsRunner): TestStateEntry[] => {
  // '__never__' matches no id, so every test is serialized (see TapTestsRunner).
  const tests = Object.values(runner.getTestsState('__never__'))
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
// like `timings` are live references into its runner state. The JSON round-trip
// snapshots the value at read time and normalizes it to its wire form.
const cloneReferenceObject = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value))
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
