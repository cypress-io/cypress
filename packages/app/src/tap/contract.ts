// App-side view of the cross-process tap contract. The shared half (types and
// constants both sides agree on) lives in `@packages/cypress-instances`; this
// module re-exports it from the package source (Vite compiles the zero-dependency
// contract module to ESM, the way the app consumes every other sibling package)
// and adds the app-only declarations the CLI never sees. The CLI itself reads the
// same contract from the package's compiled CJS build.

import type { TapSchema, TapExecResult } from '@packages/cypress-instances/lib/tap-contract'

export {
  TAP_SCHEMA_VERSION,
  TAP_COMMANDS,
  TAP_TARGET,
  MAX_DERIVED_SELECTORS,
  TapError,
  isTapError,
  InvalidValueTapError,
  UnknownCommandTapError,
  UnknownOptionTapError,
  SpecInProgressTapError,
  TestNotFoundTapError,
  CommandNotFoundTapError,
  AttemptNotFoundTapError,
  SnapshotNotFoundTapError,
  MissingCompanionOptionTapError,
  MissingArgumentsTapError,
  MissingOptionTapError,
} from '@packages/cypress-instances/lib/tap-contract'

export type {
  TapErrorCode,
  TapErrorPayload,
  TapCommandParamSchema,
  TapCommandOptionSchema,
  TapCommandName,
  TapCoercedParams,
  TapCoercedOptions,
  TapSchema,
  TapExecResult,
  ClearResult,
  PinnedView,
  PinResult,
  ResolveSelectorMatch,
  ResolveSelectorResult,
  SnapshotRef,
  TapNetworkInfo,
  TapCommandEntry,
  TapCommandHook,
  TapCommandResult,
  TapCommandSnapshot,
  TapConsoleProps,
  TapJsonValue,
  TapReporterCommand,
  TapReporterView,
  TapReporterSpecView,
  TapReporterSpecTest,
  TapReporterSpecAttempt,
  TapReporterSuite,
} from '@packages/cypress-instances/lib/tap-contract'

export interface TapBindingContract {
  getSchema (): Promise<TapSchema>
  exec (command: string, args?: Record<string, string>, options?: Record<string, string>): Promise<TapExecResult>
}
