import type { Client } from '@urql/core'

// Ambient state the tap binding needs but that lives outside the command
// modules. `gqlClient` is the app's long-lived urql client in open mode, or
// null in run mode / before the client resolves — handlers treat null as
// "fall back to the served snapshot".
export interface TapRuntime {
  gqlClient: Client | null
}
