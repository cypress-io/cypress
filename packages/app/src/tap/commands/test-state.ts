import type { SerializedTest } from '@packages/types'

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

export interface TapTestsRunner {
  getTestsState (testId?: string): Record<string, SerializedTest>
  isRunComplete (): boolean
}

export const tapRunnerSource = {
  getRunner (): TapTestsRunner | undefined {
    try {
      // Both a throw and undefined here mean there is no run to read yet.
      const eventManager = window.getEventManager?.()
      const runner = eventManager?.getCypress()?.runner

      if (!eventManager || !runner) {
        return undefined
      }

      return {
        getTestsState: runner.getTestsState,
        isRunComplete: () => eventManager.runComplete,
      }
    } catch {
      return undefined
    }
  },
}

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
    ...(timings != null ? { timings: JSON.parse(JSON.stringify(timings)) } : {}),
    ...(err != null ? { error: serializeTestError(err) } : {}),
  }
}
