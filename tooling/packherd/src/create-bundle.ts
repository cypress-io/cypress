import type { BuildOptions } from 'esbuild'
import { build } from 'esbuild'
import type { CreateBundleOpts, CreateBundleResult } from './types'

const DEFAULT_BUNDLE_OPTS: Partial<CreateBundleOpts> = {
  platform: 'node',
  target: ['node22'],
}

/**
 * The default bundle function.
 * Calls into [esbuild build](https://esbuild.github.io/api/#build-api] passing along the {@link CreateBundleOpts}.
 */
export function createBundle (
  args: CreateBundleOpts,
): Promise<CreateBundleResult> {
  // esbuild throws on unknown options, so packherd's own entryFilePath stays out
  const { entryFilePath, ...buildArgs } = args
  const opts: BuildOptions & { write: false } = {
    ...DEFAULT_BUNDLE_OPTS,
    ...buildArgs,
    entryPoints: [entryFilePath],
    bundle: true,
    write: false,
  }

  // NOTE: we just changed Output file to either have text: string or contents: UInt8Array, never both
  return (build(opts) as unknown) as Promise<CreateBundleResult>
}
