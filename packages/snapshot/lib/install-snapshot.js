'use strict'
// @ts-check

const path = require('path')
const fs = require('fs').promises

const { SnapshotGenerator, prettyPrintError } = require('v8-snapshot')

const debug = require('debug')
const logInfo = debug('snapgen:info')
const logDebug = debug('snapgen:debug')

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
    return {}
  }
}

function getSnapshotGenerator ({
  nodeModulesOnly,
  projectBaseDir,
  snapshotCacheDir,
  mksnapshotBin,
  snapshotEntryFile,
  snapshotMetaPrevFile,
  usePreviousSnapshotMetadata,
}) {
  const {
    previousNoRewrite,
    previousDeferred,
    previousHealthy,
  } = usePreviousSnapshotMetadata
    ? resolvePrevious({
      snapshotMetaPrevFile,
    })
    : {}

  return new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
    cacheDir: snapshotCacheDir,
    mksnapshotBin,
    previousDeferred,
    previousHealthy,
    previousNoRewrite,
    minify: false,
    nodeModulesOnly,
    forceNoRewrite: [
      // recursion due to process.emit overwrites which is incorrectly rewritten
      'signal-exit/index.js',
      // recursion due to process.{chdir,cwd} overwrites which are incorrectly rewritten
      'graceful-fs/polyfills.js',

      // wx is rewritten to __get_wx__ but not available for Node.js > 0.6
      'lockfile/lockfile.js',
      // rewrites dns.lookup which conflicts with our rewrite
      'evil-dns/evil-dns.js',

      // `address instanceof (__get_URL2__())` -- right hand side not an object
      // even though function is in scope
      'ws/lib/websocket.js',

      // defers PassThroughStream which is then not accepted as a constructor
      'get-stream/buffer-stream.js',

      // deferring should be fine as it just rexports `process` which in the
      // case of cache is the stub
      'process-nextick-args/index.js',

      //
      // Only needed when including app files
      //

      // resuls in recursive call to __get_fs2__
      'packages/https-proxy/lib/ca.js',
    ],
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
module.exports = async function installSnapshot ({
  cypressAppSnapshotFile,
  nodeModulesOnly,
  projectBaseDir,
  snapshotCacheDir,
  mksnapshotBin,
  snapshotEntryFile,
  snapshotMetaFile,
  snapshotMetaPrevFile,
  usePreviousSnapshotMetadata,
}) {
  try {
    logInfo('Generating snapshot %o', {
      nodeModulesOnly,
      usePreviousSnapshotMetadata,
    })

    const snapshotGenerator = getSnapshotGenerator({
      nodeModulesOnly,
      projectBaseDir,
      snapshotCacheDir,
      mksnapshotBin,
      snapshotEntryFile,
      snapshotMetaFile,
      snapshotMetaPrevFile,
      usePreviousSnapshotMetadata,
    })

    await snapshotGenerator.createScript()
    snapshotGenerator.makeSnapshot()

    // TODO(thlorenz): should we remove it or keep it for inspection, i.e. to verify it updated?
    await fs.copyFile(
      path.join(projectBaseDir, 'v8_context_snapshot.bin'),
      cypressAppSnapshotFile,
    )

    logDebug('Copied snapshot to "%s"', cypressAppSnapshotFile)
    logInfo('Done generating snapshot')
  } catch (err) {
    prettyPrintError(err, projectBaseDir)
    throw err
  }
}
