import type { SerializedCommandLog, SerializedTest } from '@packages/types'
import type { TapNetworkInfo } from './contract'

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

type TapJsonValue = null | boolean | number | string | TapJsonValue[] | { [key: string]: TapJsonValue }

export type ConsolePropsResult = { [key: string]: TapJsonValue }

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

export interface TestError {
  /** Error class name, e.g. `AssertionError`; absent on non-Error throws. */
  name?: string
  /** The thrown message; absent on non-Error throws without one. */
  message?: string
  /** The stack trace as the driver captured it. */
  stack?: string
}

export interface CommandEntry {
  /**
   * The command id the pin command accepts. Numbered rows carry the exact
   * number the app reporter shows (a per-hook-section counter, qualifiable as
   * `<hookId>:<number>` when duplicated); event and system rows carry an
   * attempt-wide `e1`..`eN` instead. Absent on `cy.intercept` registration
   * rows — routes aren't commands.
   */
  id?: string
  /** The command name as logged, e.g. `visit`, `get`, `assert`. */
  name?: string
  /**
   * The reporter's display text for the row: the command arguments/assertion
   * text, or — for a network row whose base message is empty — the request
   * summary the reporter shows in its place (e.g. `GET 200 /api/users`).
   */
  message?: string
  /** `pending` while the command runs, then `passed` or `failed`. */
  state?: SerializedCommandLog['state']
  /** `parent` starts a chain, `child` is chained off a subject, `system` is driver-emitted. */
  type?: SerializedCommandLog['type']
  /**
   * High-level network detail — method, URL, status/indicator, stubbed flag,
   * response count, alias — matching what the reporter renders inline on
   * request / xhr / `cy.intercept` rows. Absent on ordinary command rows.
   */
  network?: TapNetworkInfo
  /**
   * Present (always `true`) only when the driver evicted this test's command
   * details from memory (numTestsKeptInMemory), so scrubbed fields like
   * `message` are absent because of the eviction, not because they were unset.
   */
  cleanedUp?: true
}
