import path from 'path'
import { SnapshotGenerator } from '../generator/snapshot-generator'
import { prettyPrintError } from '../utils'
import fs from 'fs-extra'
import forceNoRewrite from './force-no-rewrite'

const debug = require('debug')
const logInfo = debug('cypress:snapgen:info')
const logDebug = debug('cypress:snapgen:debug')

function getSnapshotGenerator ({
  nodeModulesOnly,
  projectBaseDir,
  snapshotCacheDir,
  snapshotEntryFile,
  resolverMap,
  minify,
  integrityCheckSource,
}: {
  nodeModulesOnly: boolean
  projectBaseDir: string
  snapshotCacheDir: string
  snapshotEntryFile: string
  resolverMap: Record<string, string>
  minify: boolean
  integrityCheckSource: string | undefined
}) {
  return new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
    cacheDir: snapshotCacheDir,
    nodeModulesOnly,
    resolverMap,
    forceNoRewrite,
    minify,
    integrityCheckSource,
  })
}

/**
 * Generates and installs the snapshot.
 *
 * Assumes that the snapshot entry file has been generated, see ./gen-entry.js.
 * Assumes that the snapshot meta file has been generated, see ./gen-meta.js.
 *
 * @param {Partial<import('../snapconfig').SnapshotConfig>} opts
 */
export async function installSnapshot (
  {
    cypressAppSnapshotDir,
    nodeModulesOnly,
    projectBaseDir,
    snapshotCacheDir,
    snapshotEntryFile,
    minify,
    integrityCheckSource,
  },
  resolverMap,
) {
  try {
    logInfo('Generating snapshot %o', {
      nodeModulesOnly,
    })

    const snapshotGenerator = getSnapshotGenerator({
      nodeModulesOnly,
      projectBaseDir,
      snapshotCacheDir,
      snapshotEntryFile,
      resolverMap,
      minify,
      integrityCheckSource,
    })

    await snapshotGenerator.createScript()
    const { v8ContextFile, snapshotBinDir } = await snapshotGenerator.makeSnapshot()

    const cypressAppSnapshotFile = path.join(
      cypressAppSnapshotDir,
      'browser_v8_context_snapshot.bin',
    )

    await fs.copyFile(
      path.join(snapshotBinDir, v8ContextFile),
      cypressAppSnapshotFile,
    )

    logDebug('Copied snapshot to "%s"', cypressAppSnapshotFile)

    logInfo('Done generating snapshot')

    return cypressAppSnapshotFile
  } catch (err) {
    prettyPrintError(err, projectBaseDir)
    throw err
  }
}
