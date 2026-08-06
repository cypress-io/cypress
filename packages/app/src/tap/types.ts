import type { SerializedTest } from '@packages/types'
import type { TapCommandEntry, TapCommandHook, TapCommandResult, TapConsoleProps } from './contract'

// The command-log and console-props result shapes are the cross-process
// contract, so they live in `@packages/cypress-instances` alongside the CLI-side
// rendering that consumes them; aliased here to the names the app uses.
export type CommandEntry = TapCommandEntry

export type CommandResult = TapCommandResult

export type CommandHook = TapCommandHook

export type ConsolePropsResult = TapConsoleProps

export interface TapTestsRunner {
  /** Every test's state, keyed by id. */
  getAllTestStates (): Record<string, SerializedTest['state']>
  /** Every test's own properties, keyed by id, without its command logs. */
  getAllTestsSummary (): Record<string, SerializedTest>
  /** Serializes one test by id lookup, skipping the whole-run serialization cost. */
  getTestState (testId: string): SerializedTest | undefined
  /**
   * Returns one command's console properties projected for the JSON-only tap
   * transport. A value long enough to bury the rest of the payload is named by
   * its length unless `full` asks for every value in full.
   */
  getSerializedConsolePropsForLog (testId: string, logId: string, options?: { full?: boolean }): ConsolePropsResult | undefined
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
  /** Wall-clock capture time in ms, as the driver stamps it (`timeOrigin + now()`, hence fractional). */
  timestamp?: number
}

export interface PinSnapshotProps {
  url?: string
  snapshots?: Array<PinSnapshotEntry | null | undefined> | null
}

export interface PinSnapshotRunner {
  getTestState (testId: string): SerializedTest | undefined
  getSnapshotPropsForLog (testId: string, logId: string): PinSnapshotProps | undefined
}

/** The app-under-test elements a selector matched, narrowed to what we read. */
interface TapAutElements {
  length: number
  item (index: number): unknown
}

/**
 * What the resolve-selector command needs of the runner: the app under test's
 * own view of its document, and the driver's selector generator — the same one
 * behind the Selector Playground, so a selector tap hands back is the selector
 * the app would show for that element.
 */
export interface TapElementSelectorSource {
  /** Matches in document order. Throws on a selector the browser rejects. */
  find (selector: string): TapAutElements
  /** A selector unique to this element, or null when none could be derived. */
  getSelector (element: unknown): string | null
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
