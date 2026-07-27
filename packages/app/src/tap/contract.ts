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
  TAP_RUN_IN_PROGRESS_MESSAGE,
} from '@packages/cypress-instances/lib/tap-contract'

export type {
  TapCommandParamSchema,
  TapCommandOptionSchema,
  TapCommandName,
  TapSchema,
  TapExecResult,
} from '@packages/cypress-instances/lib/tap-contract'

// Reserved dispatch-level failure codes `exec` itself produces; domain failures
// carry a command-defined code, so TapExecResult.code stays an open string.
export type TapExecDispatchFailureCode = 'UNKNOWN_COMMAND' | 'INVALID_PAYLOAD' | 'INVALID_ARGUMENTS' | 'INVALID_OPTIONS'

export interface TapBindingContract {
  getSchema (): Promise<TapSchema>
  exec (command: string, args?: Record<string, string>, options?: Record<string, string>): Promise<TapExecResult>
}
