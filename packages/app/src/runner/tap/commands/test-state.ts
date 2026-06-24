import type { SerializedTest } from '@packages/types'

/**
 * One test of the active run, trimmed to the fields a tap caller needs to
 * follow run progress. `duration` and `retries` are absent (never `null` —
 * JSON drops `undefined` keys at the CDP boundary) until the test has run;
 * `state` defaults to `'pending'` until then.
 */
export interface TestStateEntry {
  id: string
  title: string
  /** Milliseconds the latest attempt took. */
  duration?: number
  state: string
  /** Retries actually taken this run, not the configured maximum. */
  retries?: number
}

/**
 * The failure of a test's latest attempt, trimmed to its messaging fields.
 * Every field is optional and absent (never `null` — JSON drops `undefined`
 * keys at the CDP boundary) when the serialized error did not carry it.
 */
export interface TestError {
  /** The error's constructor name, e.g. `AssertionError`, `CypressError`. */
  name?: string
  /** The human-readable failure message. */
  message?: string
  /** The full stack trace, as the driver normalized it. */
  stack?: string
}

/**
 * One test of the active run with the detail a tap caller needs to diagnose
 * it — the lean `TestStateEntry` fields plus its full title path, per-phase
 * timings, and the latest attempt's error. As elsewhere, optional fields are
 * absent (never `null`) until the run produces them.
 */
export interface TestDetailEntry {
  id: string
  title: string
  /** The suite titles leading to this test plus its own, joined with ` > `. */
  fullTitle: string
  /** Milliseconds the latest attempt took. */
  duration?: number
  state: string
  /** Retries actually taken this run, not the configured maximum. */
  retries?: number
  /** The driver's per-phase timing breakdown (lifecycle, hooks, test body). */
  timings?: Record<string, unknown>
  /** The latest attempt's failure; absent when the test has not failed. */
  error?: TestError
}

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

/**
 * The slice of the driver's `Cypress.runner` the tap commands consume.
 * `getTestsState(testId)` serializes the run's tests up to (excluding) the
 * one whose id matches, so a never-matching sentinel yields every test.
 */
export interface TapTestsRunner {
  getTestsState (testId?: string): Record<string, SerializedTest>
}

/**
 * Seam over the driver runner the tap commands read. Component tests stub
 * this — the real lookup reaches the Cypress instance running the test.
 *
 * The instance comes from the event manager rather than `window.Cypress`:
 * when the runner page is itself an AUT (the cypress-in-cypress harness),
 * `window.Cypress` is the OUTER driver injected into it, while the event
 * manager only ever holds this app's own instance.
 */
export const tapRunnerSource = {
  getRunner (): TapTestsRunner | undefined {
    try {
      // getEventManager throws until the unified runner page initializes it,
      // and getCypress() is undefined until a spec is set up — both mean
      // there is no run to read yet.
      return window.getEventManager?.().getCypress()?.runner
    } catch {
      return undefined
    }
  },
}

/** Serialize every test of the run into lean, JSON-clean entries. */
export const serializeTestsState = (runner: TapTestsRunner): TestStateEntry[] => {
  // '__never__' matches no test id, so getTestsState serializes every
  // test of the run instead of stopping at the active one.
  const tests = Object.values(runner.getTestsState('__never__'))

  // Optional fields are omitted rather than set to undefined so the
  // in-memory result already equals its JSON wire form.
  return tests.map(({ id, title, duration, state, currentRetry }): TestStateEntry => {
    return {
      id,
      title,
      ...(duration !== undefined ? { duration } : {}),
      ...(state !== undefined ? { state } : { state: 'pending' }),
      ...(currentRetry !== undefined ? { retries: currentRetry } : {}),
    }
  })
}

/**
 * Trim a serialized error to its messaging fields, omitting any the driver did
 * not record so the result already equals its JSON wire form.
 */
const serializeTestError = (err: Record<string, unknown>): TestError => {
  const { name, message, stack } = err

  return {
    ...(name !== undefined ? { name: name as string } : {}),
    ...(message !== undefined ? { message: message as string } : {}),
    ...(stack !== undefined ? { stack: stack as string } : {}),
  }
}

/**
 * Serialize the detail of one test of the run into a lean, JSON-clean entry.
 * Returns `undefined` when no test of the run has that id (the command turns
 * this into a `TEST_NOT_FOUND` failure); a known test that has not run yet
 * simply carries no duration, timings, or error.
 */
export const serializeTestDetail = (runner: TapTestsRunner, testId: string): TestDetailEntry | undefined => {
  // '__never__' serializes every test; we must NOT pass testId, as
  // getTestsState serializes tests UP TO (excluding) the matching id and so
  // would never include the test we are after.
  const test = runner.getTestsState('__never__')[testId]

  if (!test) {
    return undefined
  }

  const { id, title, duration, state, currentRetry } = test
  // `_titlePath` is the runnable's titlePath() — suite titles plus the test's
  // own; `timings` and `err` are absent until the test runs (and `err` only on
  // failure). All three are typed `unknown` on the serialized shape.
  const titlePath = test._titlePath as string[] | undefined
  const timings = test.timings as Record<string, unknown> | undefined
  const err = test.err as Record<string, unknown> | undefined

  return {
    id,
    title,
    fullTitle: Array.isArray(titlePath) ? titlePath.join(' > ') : title,
    ...(duration !== undefined ? { duration } : {}),
    ...(state !== undefined ? { state } : { state: 'pending' }),
    ...(currentRetry !== undefined ? { retries: currentRetry } : {}),
    ...(timings !== undefined ? { timings } : {}),
    ...(err !== undefined ? { error: serializeTestError(err) } : {}),
  }
}

/**
 * Serialize the command log of one test into lean, JSON-clean entries.
 * Returns `undefined` when no test of the run has that id (the command turns
 * this into a `testNotFound` result); a known test that has not run yet has no
 * command log, which serializes to an empty array, not a failure.
 */
export const serializeTestCommands = (runner: TapTestsRunner, testId: string): CommandEntry[] | undefined => {
  // '__never__' serializes every test with its logs. We must NOT pass testId:
  // getTestsState serializes tests UP TO (excluding) the matching id, so it
  // would never include the test we are after.
  const test = runner.getTestsState('__never__')[testId]

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
