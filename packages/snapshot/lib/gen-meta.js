'use strict'
// @ts-check

const { writeFileSync } = require('fs')

const { generateBundlerMetadata } = require('v8-snapshot')

const debug = require('debug')
const { ensureParentDir } = require('./util')
const logInfo = debug('snapgen:info')
const logDebug = debug('snapgen:debug')
const logError = debug('snapgen:error')

async function createMeta ({
  appEntryFile,
  nodeModulesOnly,
  pathsMapper,
  projectBaseDir,
  snapshotEntryFile,
}) {
  return generateBundlerMetadata(projectBaseDir, snapshotEntryFile, {
    entryFile: appEntryFile,
    pathsMapper,
    nodeModulesOnly,
  })
}

/**
 * Generates the snapshot meta file by following all dependencies of
 * the `appEntryFile` via `v8-snapshot`.
 * This file is then used by the snapshot doctor to determine how to process
 * the modules found inside the snapshot entry.
 *
 * @param {Partial<import('../snapconfig').SnapshotConfig>} opts
 * @return {Promise<Metadata>} metadata
 */
module.exports = async function genMeta ({
  appEntryFile,
  metaFile,
  nodeModulesOnly,
  pathsMapper,
  projectBaseDir,
  snapshotEntryFile,
}) {
  try {
    logInfo('Creating snapshot metadata %o', { nodeModulesOnly })

    const meta = await createMeta({
      appEntryFile,
      nodeModulesOnly,
      pathsMapper,
      projectBaseDir,
      snapshotEntryFile,
    })

    ensureParentDir(metaFile)
    writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf8')
    logDebug('Written to', metaFile)

    logInfo('Done creating snapshot metadata')

    return meta
  } catch (err) {
    logError(err)
    throw err
  }
}
