import type { SerializedTest } from '@packages/types'
import type { TapCommandEntry, TapCommandHook, TapConsoleProps, TapJsonValue } from './contract'

// The command-log and console-props result shapes are the cross-process
// contract, so they live in `@packages/cypress-instances` alongside the CLI-side
// rendering that consumes them; aliased here to the names the app uses.
export type CommandEntry = TapCommandEntry

export type CommandHook = TapCommandHook

export type ConsolePropsResult = TapConsoleProps

export type { TapJsonValue }

export interface TapTestsRunner {
  /** Serializes every test of the run, keyed by id. */
  getAllTestsState (): Record<string, SerializedTest>
  /** Serializes one test by id lookup, skipping the whole-run serialization cost. */
  getTestState (testId: string): SerializedTest | undefined
  /**
   * Returns one command's console properties projected for the JSON-only tap
   * transport. A value long enough to bury the rest of the payload is named by
   * its length unless `fullReport` asks for every value in full.
   */
  getSerializedConsolePropsForLog (testId: string, logId: string, options?: { fullReport?: boolean }): ConsolePropsResult | undefined
  isRunComplete (): boolean
  /** ISO start time of the run; null before the first test runs. */
  getStartTime (): string | null
}

/**
 * One snapshot on a command log, as `getSnapshotPropsForLog` exposes it: the
 * cloned body sits behind an opaque object that `restoreDom` knows how to
 * render. We read only the optional `name` (to select/label it) and otherwise
 * treat the entry as opaque.
 */
export interface PinSnapshotEntry {
  name?: string
}

export interface PinSnapshotProps {
  url?: string
  snapshots?: Array<PinSnapshotEntry | null | undefined> | null
}

export interface PinSnapshotRunner {
  getTestState (testId: string): SerializedTest | undefined
  getSnapshotPropsForLog (testId: string, logId: string): PinSnapshotProps | undefined
}

/**
 * The slice of the AUT iframe the pin command drives directly. `detachDom`
 * captures (and detaches) the current body so it can be put back on release —
 * the reliable restore the app's own unpin can't give a cold pin (see below).
 */
export interface PinAutIframe {
  detachDom (): unknown
  restoreDom (snapshot: unknown): void
}

export type TestStateValue = 'passed' | 'failed' | 'pending' | 'skipped'

export interface TestStateEntry {
  /** The runner's test id, e.g. `r2` — the handle other tap commands accept. */
  id: string
  /** The test's own title, without its suite path. */
  title: string
  /** Wall-clock run time in ms; absent until the test has run. */
  duration?: number
  /** Final status, or the unreached placeholder (`pending` mid-run, `skipped` after). */
  state: TestStateValue
  /** Retries actually taken this run, not the configured maximum. */
  retries?: number
}

export interface TestError {
  /** Error class name, e.g. `AssertionError`; absent on non-Error throws. */
  name?: string
  /** The thrown message; absent on non-Error throws without one. */
  message?: string
  /** The stack trace as the driver captured it. */
  stack?: string
}

export interface TestDetailEntry {
  /** The runner's test id, e.g. `r2` — the handle other tap commands accept. */
  id: string
  /** The test's own title, without its suite path. */
  title: string
  /** Suite titles leading to this test plus its own, joined with ` > `. */
  fullTitle: string
  /** Wall-clock run time in ms; absent until the test has run. */
  duration?: number
  /** Final status, or the unreached placeholder (`pending` mid-run, `skipped` after). */
  state: TestStateValue
  /** Retries actually taken this run, not the configured maximum. */
  retries?: number
  /** The driver's lifecycle/hook timing breakdown; absent until the test has run. */
  timings?: Record<string, unknown>
  /** The failure that ended the test; absent unless it failed. */
  error?: TestError
}
