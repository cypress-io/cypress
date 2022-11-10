import fs from 'fs-extra'
import { tmpdir } from 'os'
import path from 'path'

/**
 * Determines where to store temporary output files produced by esbuild.
 */
export async function tmpFilePaths () {
  const bundleTmpDir = path.join(tmpdir(), 'packherd')

  await fs.ensureDir(bundleTmpDir)

  const outfile = path.join(bundleTmpDir, 'bundle.js')

  return { outfile }
}
