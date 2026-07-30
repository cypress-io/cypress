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
 * The `command` command's default result: one row of the reporter's command
 * log, the lean projection the `commands` listing also returns.
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
   * The hook this row ran in, resolved for a single command rather than carried
   * by every row of the `commands` listing. Absent when the row ran in the test
   * body itself — the section an unqualified command id resolves to.
   */
  hook?: TapCommandHook
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

export type TapJsonValue = null | boolean | number | string | TapJsonValue[] | { [key: string]: TapJsonValue }

/**
 * The `command --props` result: a command's console properties, projected for
 * the JSON-only tap transport.
 *
 * The driver wraps every log's properties in a fixed envelope — the command's
 * own key/values under `props`, with `name`, `type` (`command` or `event`) and
 * any of `table`, `groups`, `error`, `snapshot`, `args` alongside it. The
 * values themselves are whatever the command logged, hence the open shape; a
 * value long enough to bury the rest of the payload arrives named by its length
 * unless `--full-report` asks for it in full. A command whose details the driver
 * has evicted from memory yields a bare `{ Message }` with no envelope.
 */
export type TapConsoleProps = { [key: string]: TapJsonValue }
