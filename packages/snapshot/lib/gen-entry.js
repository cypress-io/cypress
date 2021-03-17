'use strict'
// @ts-check

const { generateSnapshotEntryFromEntryDeps } = require('v8-snapshot')

const debug = require('debug')
const { ensureParentDir } = require('./util')
const logInfo = debug('snapgen:info')
const logError = debug('snapgen:error')

/**
 * Generates the snapshot entry file by following all dependencies of
 * the `appEntryFile` via `v8-snapshot`.
 *
 * @param {Partial<import('../snapconfig').SnapshotConfig>} opts
 */
module.exports = async function genEntry ({
  appEntryFile,
  nodeModulesOnly,
  pathsMapper,
  projectBaseDir,
  snapshotEntryFile,
}) {
  logInfo('Creating snapshot generation entry file %o', { nodeModulesOnly })

  try {
    ensureParentDir(snapshotEntryFile)

    await generateSnapshotEntryFromEntryDeps(
      projectBaseDir,
      snapshotEntryFile,
      {
        entryFile: appEntryFile,
        pathsMapper,
        nodeModulesOnly,
      },
    )

    logInfo('Done creating snapshot generation entry file')
  } catch (err) {
    logError(err)
    throw err
  }
}
