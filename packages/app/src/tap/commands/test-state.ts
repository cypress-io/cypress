import type { SerializedTest } from '@packages/types'

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

export const serializeTestCommands = (runner: TapTestsRunner, testId: string): CommandEntry[] | undefined => {
  const test = runner.getAllTestsState()[testId]

  if (!test) {
    return undefined
  }

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
