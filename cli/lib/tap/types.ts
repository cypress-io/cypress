import type { TapNativeCommandSchema } from '@packages/cypress-instances'

/** Options `cypress tap` accepts from the top-level CLI. */
export interface TapCliOptions {
  instance?: number
  /** Print the raw JSON result even when the command has a human-readable rendering. */
  json?: boolean
}

/**
 * A tap subcommand implemented entirely in the CLI, as opposed to the commands
 * discovered from the running Cypress instance's schema. Its declarative shape
 * (description, params, options, help prose) comes from `TAP_NATIVE_COMMANDS`;
 * its positionals and options are parsed CLI-side with the same commander
 * grammar the schema commands use, then handed to `handler` as raw strings
 * keyed by name. `handler` is the erased view the dispatcher calls through —
 * `defineNativeCommand` types each command's handler precisely for authoring.
 */
export interface TapCliCommand extends TapNativeCommandSchema {
  handler: (...args: any[]) => Promise<number>
}

/**
 * A reference to the currently pinned command, so a pin is always visible in
 * `status` and a stranded one is recoverable.
 */
export interface PinnedRef {
  /** The pinned command's name. */
  command: string
  /** Which test the pinned command belongs to. */
  at: { index: number, name?: string }
}

/**
 * The `run-state` payload reported by the running Cypress instance's tap
 * binding. Mirrors the app-side result shape, which travels over CDP as
 * untyped JSON.
 */
export interface TapRunState {
  /** Relative path of the selected spec, or `null` before one is selected. */
  spec: string | null
  /** Number of specs the instance can run. */
  totalSpecs: number
  /** Where the selected spec is in its run; absent until a spec is selected. */
  state?: 'running' | 'passed' | 'failed'
  /** Number of tests the selected spec declares. */
  totalTests?: number
  /** Per-outcome test counts for the selected spec. */
  results?: { passed: number, failed: number, pending: number, skipped: number }
  /** The currently pinned command, if any. */
  pinned?: PinnedRef
}

/**
 * What `cypress tap status` renders: how far the instance has progressed
 * through its lifecycle, plus run progress once a spec is selected.
 */
export interface TapStatus {
  /**
   * Lifecycle phase: `not connected`, `browser not selected`,
   * `spec not selected`, or the run state (`running` | `passed` | `failed`).
   */
  status: string
  /** Process id of the running Cypress instance. */
  pid?: number
  /** Absolute path of the project the instance has open. */
  projectRoot?: string
  /** Testing type the instance has open, or `null` before one is chosen. */
  testingType?: 'e2e' | 'component' | null
  /** Whether the instance has a browser attached over CDP. */
  browserAttached?: boolean
  /** Number of specs the instance can run. */
  totalSpecs?: number
  /** Relative path of the selected spec. */
  spec?: string
  /** Number of tests the selected spec declares. */
  totalTests?: number
  /** Per-outcome test counts for the selected spec. */
  results?: { passed: number, failed: number, pending: number, skipped: number }
  /** The currently pinned command, if any. */
  pinned?: PinnedRef
}
