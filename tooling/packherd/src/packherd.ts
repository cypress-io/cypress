import path from 'path'
import { strict as assert } from 'assert'
import { createBundle as defaultCreateBundle } from './create-bundle'
import { EntryGenerator, PathsMapper } from './generate-entry'
import { tmpFilePaths } from './utils'
import type { CreateBundle } from './types'

export * from './types'

/**
 * Options which control how the packherd bundle is generated
 *
 * @property entryFile: path to index file of app to bundle
 *
 * @property nodeModulesOnly: if `true` only `node_modules` are included in the
 * bundle
 *
 * @property pathsMapper: if provided, the paths under which modules are
 * included in the bundle will be mapped
 *
 * @property createBundle: allows overriding the function used to create the
 * bundle
 */
export type PackherdOpts = {
  entryFile: string
  nodeModulesOnly?: boolean
  pathsMapper?: PathsMapper
  createBundle?: CreateBundle
}

/**
 * packherd function which is a thin layer around [esbuild](https://github.com/evanw/esbuild)
 *
 * The return value includes the below:
 *  - `bundle` Buffer
 *  - optionally a Buffer containing the `sourceMap` content
 *  - `meta` containing information about the bundled assets
 *  - `warnings` emitted by esbuild
 */
export async function packherd (opts: PackherdOpts) {
  const createBundle = opts.createBundle || defaultCreateBundle
  const entryGenerator = new EntryGenerator(
    createBundle,
    opts.entryFile,
    opts.nodeModulesOnly,
    opts.pathsMapper,
  )

  const { entry } = await entryGenerator.createEntryScript()
  const { outfile } = await tmpFilePaths()

  const {
    outputFiles,
    metafile,
    sourceMap: sourceMapFile,
    warnings,
  } = await createBundle({
    outdir: path.dirname(outfile),
    metafile: true,
    entryFilePath: opts.entryFile,
    stdin: {
      contents: entry,
      sourcefile: opts.entryFile,
      resolveDir: path.dirname(opts.entryFile),
    },
  })

  assert(metafile != null, 'createBundle should return metafile')

  // When using the `stdin` option esbuild sends the same outputFile twice, as
  // .../stdin.js and .../entry.js
  assert(
    outputFiles.length === 1 || outputFiles.length === 2,
    `expecting exactly one or two outputFiles, got ${outputFiles.length} instead`,
  )

  const [bundleFile] = outputFiles

  assert(bundleFile.contents != null, 'bundle output should include contents')

  const bundle = Buffer.isBuffer(bundleFile.contents)
    ? bundleFile.contents
    : Buffer.from(bundleFile.contents)

  const sourceMap =
    sourceMapFile == null
      ? undefined
      : Buffer.isBuffer(sourceMapFile?.contents)
        ? sourceMapFile.contents
        : Buffer.from(sourceMapFile.contents)

  return {
    bundle,
    sourceMap,
    meta: metafile,
    warnings,
  }
}
