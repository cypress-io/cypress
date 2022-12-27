import { createBundleAsync } from './create-snapshot-script'
import type { CreateSnapshotScriptOpts, Metadata } from '../types'

const prelude = `function get_process() {
  if (typeof process === 'undefined') return undefined
  return process
}
function get_document() {
  if (typeof document === 'undefined') return undefined
  return document
}

function get_global() {
  if (typeof global === 'undefined') return undefined
  return global
}

function get_window() {
  if (typeof window === 'undefined') return undefined
  return window
}

function get_console() {
  if (typeof console === 'undefined') return undefined
  return console
}

let __pathResolver = {}
Object.defineProperties(__pathResolver, {
  resolve: {
    value: function resolve(_local) {
      throw new Error(
        '[SNAPSHOT_CACHE_FAILURE] Cannot resolve path in the snapshot'
      )
    },
    enumerable: false,
  },
})

function __resolve_path(local) {
  __pathResolver.resolve(local)
}
`

const postlude = `
module.exports = __commonJS`

export type ExportScript = { snapshotBundle: string, meta: Metadata, bundle: Buffer }

/**
 * Similar to see {@link createSnapshotScript}, but creates a bundle instead which provides all
 *  definitions via its export.
 *  This is mostly used when diagnosing/debugging why a particular snapshot script has problems.
 *
 * @param opts
 * @return the paths and contents of the originally created bundle and related metadata
 * as well as the version which includes module exports.
 */
export async function createExportScript (
  opts: CreateSnapshotScriptOpts,
): Promise<ExportScript> {
  const { bundle, meta } = await createBundleAsync(opts)
  const snapshotBundle = `${prelude}
${bundle.toString()}
${postlude}`

  return { snapshotBundle, meta: meta as Metadata, bundle }
}
