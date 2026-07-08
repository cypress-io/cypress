import type { TapTestsRunner } from './test-state'

// Optional fields throughout are absent rather than null: JSON drops undefined
// keys at the CDP boundary, so the in-memory shape already equals the wire form.

/**
 * One DOM snapshot as the driver stores it on a command log: the cloned
 * `<body>` sits behind `body.get()` (adopting it into the current document on
 * first read — required before serializing, since the clone lives in an XML
 * document until then). Scripts, style tags, and stylesheet links are stripped
 * from the clone at capture; styles travel separately (see `tapSnapshotStyles`).
 */
export interface SnapshotEntry {
  name?: string
  body?: { get (): ArrayLike<Element> }
}

/**
 * What `runner.getSnapshotPropsForLog` picks off the live log attrs. The
 * entries in `snapshots` can be missing, empty, sparse, or null (evicted by
 * numTestsKeptInMemory cleanup) — `readSnapshots` collapses all of those.
 */
export interface SnapshotProps {
  url?: string
  highlightAttr?: string
  viewportWidth?: number
  viewportHeight?: number
  snapshots?: Array<SnapshotEntry | null | undefined> | null
}

/**
 * The runner surface the snapshot command reads: the tests state for
 * test/command existence checks, plus the reporter's snapshot seam.
 */
export interface TapSnapshotRunner extends TapTestsRunner {
  getSnapshotPropsForLog (testId: string, logId: string): SnapshotProps | undefined
}

/**
 * Seam over the driver runner, like `tapRunnerSource` but typed to the
 * snapshot surface (component tests stub it). Same access path: the event
 * manager's Cypress, never `window.Cypress` (cypress-in-cypress hands that to
 * the outer driver).
 */
export const tapSnapshotSource = {
  getRunner (): TapSnapshotRunner | undefined {
    try {
      return window.getEventManager?.().getCypress()?.runner
    } catch {
      return undefined
    }
  },
}

/** Stylesheet text, or a bare href for sheets whose text is unreadable (cross-origin). */
export type SnapshotStyle = string | { href: string }

export interface SnapshotStyles {
  headStyles?: SnapshotStyle[]
  bodyStyles?: SnapshotStyle[]
}

/**
 * Seam over the driver's snapshot-styles lookup. The styles live in a WeakMap
 * keyed by the exact snapshot object, so this must receive the entry from
 * `getSnapshotPropsForLog`, never a copy.
 */
export const tapSnapshotStyles = {
  getStyles (snapshot: SnapshotEntry): SnapshotStyles {
    try {
      return window.getEventManager?.().getCypress()?.cy?.getStyles(snapshot) ?? {}
    } catch {
      return {}
    }
  },
}

/** A snapshot the wire can describe: its 1-based position plus optional name. */
export interface SnapshotRef {
  index: number
  name?: string
}

export const toSnapshotRef = (entry: SnapshotEntry, position: number): SnapshotRef => {
  return {
    index: position + 1,
    ...(entry.name !== undefined ? { name: entry.name } : {}),
  }
}

/** Collapses the four raw shapes (missing/empty/sparse/null) to a dense list. */
export const readSnapshots = (props: SnapshotProps | undefined): SnapshotEntry[] => {
  return (props?.snapshots ?? []).filter((entry): entry is SnapshotEntry => Boolean(entry))
}
