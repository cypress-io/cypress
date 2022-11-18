import path from 'path'
import { SnapshotGenerator } from '../generator/snapshot-generator'
import { prettyPrintError } from '../utils'
import fs from 'fs-extra'
import forceNoRewrite from './force-no-rewrite'

const debug = require('debug')
const logInfo = debug('cypress:snapgen:info')
const logDebug = debug('cypress:snapgen:debug')

/*
 * Tries to resolve results from the previous step for the given environment.
 * Returns empty object if resolution failed.
 */
function resolvePrevious ({ snapshotMetaPrevFile }) {
  try {
    const {
      norewrite: previousNoRewrite,
      deferred: previousDeferred,
      healthy: previousHealthy,
    } = require(snapshotMetaPrevFile)

    return { previousNoRewrite, previousDeferred, previousHealthy }
  } catch (_) {
    return { previousNoRewrite: [], previousDeferred: [], previousHealthy: [] }
  }
}

function getSnapshotGenerator ({
  nodeModulesOnly,
  projectBaseDir,
  snapshotCacheDir,
  snapshotEntryFile,
  snapshotMetaPrevFile,
  usePreviousSnapshotMetadata,
  resolverMap,
  minify,
}: {
  nodeModulesOnly: boolean
  projectBaseDir: string
  snapshotCacheDir: string
  snapshotEntryFile: string
  snapshotMetaPrevFile: string
  usePreviousSnapshotMetadata: boolean
  resolverMap: Record<string, string>
  minify: boolean
}) {
  const {
    previousNoRewrite,
    previousDeferred,
    previousHealthy,
  } = usePreviousSnapshotMetadata
    ? resolvePrevious({
      snapshotMetaPrevFile,
    })
    : {
      previousNoRewrite: [], previousDeferred: [], previousHealthy: [],
    }

  return new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
    cacheDir: snapshotCacheDir,
    previousDeferred,
    previousHealthy,
    previousNoRewrite,
    nodeModulesOnly,
    resolverMap,
    forceNoRewrite,
    minify,
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
    snapshotMetaPrevFile,
    usePreviousSnapshotMetadata,
    minify,
  },
  resolverMap,
) {
  try {
    logInfo('Generating snapshot %o', {
      nodeModulesOnly,
      usePreviousSnapshotMetadata,
    })

    const snapshotGenerator = getSnapshotGenerator({
      nodeModulesOnly,
      projectBaseDir,
      snapshotCacheDir,
      snapshotEntryFile,
      snapshotMetaPrevFile,
      usePreviousSnapshotMetadata,
      resolverMap,
      minify,
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
