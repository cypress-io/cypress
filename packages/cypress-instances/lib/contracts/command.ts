// The `command` command's result contracts. A command's result interface lives
// here in `contracts/`, next to the command metadata in `../tap-contract`, so
// the app-side serializer and the CLI-side rendering type against the same
// shape. Optional fields are absent, never null, on the wire.

import type { TapNetworkInfo } from './reporter'

/**
 * The hook section a command row ran in — one of the sections the reporter
 * panel splits an attempt into.
 */
export interface TapCommandHook {
  hookId: string
  /**
   * The reporter's label for the section, e.g. `before each`, `after all`.
   * Absent for a hook the attempt has not timed yet — a hook still running.
   */
  hookName?: string
}

/**
 * One DOM snapshot captured on a command row, as `pin --at` addresses it — by
 * the driver's name for it or by its 1-based position.
 */
export interface TapCommandSnapshot {
  /** 1-based position in the row's snapshots, in capture order. */
  index: number
  /** The driver's label, e.g. `before`, `after`. Absent on a row that captured one unnamed snapshot. */
  name?: string
  /** Wall-clock ms since the epoch at which the driver captured it. Absent on a snapshot the driver did not stamp. */
  timestamp?: number
}

/**
 * One row of the reporter's command log, as the `command` command reports it.
 */
export interface TapCommandEntry {
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
  state?: 'pending' | 'passed' | 'failed'
  /** `parent` starts a chain, `child` is chained off a subject, `system` is driver-emitted. */
  type?: 'parent' | 'child' | 'system'
  /**
   * The section of the reporter panel this row ran under. A row of the test
   * itself reports the reporter's own synthesized `test body` section — the
   * section an unqualified command id resolves to.
   */
  hook: TapCommandHook
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

/**
 * Everything the `command` command reports about one row: the row itself, the
 * DOM snapshots pinnable on it, and the console properties the command logged.
 * `snapshots` is always present — an empty list means the row has none to pin (a
 * command that captured none, or a test the driver evicted from memory), never
 * that they went unreported.
 */
export interface TapCommandResult extends TapCommandEntry {
  snapshots: TapCommandSnapshot[]
  /**
   * The command's console properties. Absent when the driver has none to give —
   * a row that logged none, or a test whose details it evicted from memory.
   */
  consoleProps?: TapConsoleProps
}

export type TapJsonValue = null | boolean | number | string | TapJsonValue[] | { [key: string]: TapJsonValue }

/**
 * The `command --props` result: a command's console properties, projected for
 * the JSON-only tap transport.
 *
 * The driver wraps every log's properties in a fixed envelope — the command's
 * own key/values under `props`, with `name`, `type` (`command` or `event`) and
 * any of `table`, `groups`, `error`, `args` alongside it. The values themselves
 * are whatever the command logged, hence the open shape; a value long enough to
 * bury the rest of the payload arrives named by its length unless
 * `--full-report` asks for it in full. A command whose details the driver has
 * evicted from memory yields a bare `{ Message }` with no envelope.
 */
export type TapConsoleProps = { [key: string]: TapJsonValue }
