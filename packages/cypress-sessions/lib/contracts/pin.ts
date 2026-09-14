import type { PinnedView } from './pinned'

// The `pin` command's result contract. A command's result interface lives here
// in `contracts/`, next to the command metadata in `../tap-contract`, so the
// app-side command and the CLI-side rendering type against the same shape.
// Optional fields are absent, never null, on the wire.

/** A successful pin (or snapshot move): what is now pinned, and the frame url it restored. */
export interface PinResult {
  pinned: PinnedView
  /** The pinned snapshot's frame URL; absent when the runner didn't record one. */
  url?: string
}

/** The result of `pin --clear`: whether a pin was actually released. */
export interface ClearResult {
  cleared: boolean
}
