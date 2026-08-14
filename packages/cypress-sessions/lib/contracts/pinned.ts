import type { TapReporterCommand } from './reporter'

// The pinned command as every surface reports it — `pin` itself and the `status`
// command's pin line — so both render the same block. Optional fields are
// absent, never null, on the wire.

/** Which snapshot of a command is pinned: its 1-based index, how many the command took, and the snapshot's name. */
export interface SnapshotRef {
  index: number
  total: number
  name?: string
}

/** The pinned command: its reporter row, the hook section that row renders under, and the snapshot showing. */
export interface PinnedView {
  /** Id of the test the pinned command belongs to. */
  test: string
  /** The pinned row, exactly as the reporter command log reports it. */
  command: TapReporterCommand
  /** Display name of the row's hook section, e.g. `before each`, `test body`. */
  hookName?: string
  /** Which of the command's snapshots is showing. */
  at: SnapshotRef
}
