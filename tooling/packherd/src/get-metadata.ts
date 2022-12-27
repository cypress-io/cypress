import { strict as assert } from 'assert'
import type { Metafile } from 'esbuild'
import type { CreateBundle } from './types'

/**
 * Builds the bundle via esbuild with the sole purpose of extracting the metadata which esbuild produces aside from the
 * bundle.
 * This data can be used to reason about dependencies and build a custom entry file like we do in the {@link EntryGenerator}.
 * {@see ./generate-entry}.
 *
 * @param createBundle create bundle function which calls into esbuild
 * @param entryFilePath file that is the apps main entry and (in)directly references all app and node_modules
 * @param outbase {@link https://esbuild.github.io/api/#outbase} directory, usually the dir where the entry file resides
 */
export async function getMetadata (
  createBundle: CreateBundle,
  entryFilePath: string,
  outbase: string,
): Promise<Metafile> {
  const { metafile } = await createBundle({
    metafile: true,
    outfile: '<stdout:out>',
    entryFilePath,
    outbase,
  })

  assert(metafile != null, 'createBundle should return result with metaFile')

  return metafile
}
