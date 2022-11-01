import { BuildOptions, build } from 'esbuild'
import type { CreateBundleOpts, CreateBundleResult } from './types'

const DEFAULT_BUNDLE_OPTS: Partial<CreateBundleOpts> = {
  platform: 'node',
  target: ['node14.5'],
}

/**
 * The default bundle function.
 * Calls into [esbuild build](https://esbuild.github.io/api/#build-api] passing along the {@link CreateBundleOpts}.
 */
export function createBundle (
  args: CreateBundleOpts,
): Promise<CreateBundleResult> {
  const opts = Object.assign({}, DEFAULT_BUNDLE_OPTS, args, {
    entryPoints: [args.entryFilePath],
    bundle: true,
    write: false,
  }) as BuildOptions & { write: false }

  // This is not ideal, but esbuild throws if it encounters an unknown opt
  // @ts-ignore
  delete opts.entryFilePath

  // NOTE: we just changed Output file to either have text: string or contents: UInt8Array, never both
  return (build(opts) as unknown) as Promise<CreateBundleResult>
}
