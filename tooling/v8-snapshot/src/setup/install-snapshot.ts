import path from 'path'
import { SnapshotGenerator } from '../generator/snapshot-generator'
import { prettyPrintError } from '../utils'
import fs from 'fs-extra'

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
}: {
  nodeModulesOnly: boolean
  projectBaseDir: string
  snapshotCacheDir: string
  snapshotEntryFile: string
  snapshotMetaPrevFile: string
  usePreviousSnapshotMetadata: boolean
  resolverMap: Record<string, string>
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
    minify: false,
    nodeModulesOnly,
    resolverMap,
    // sourcemapEmbed: true,
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

      // deferring should be fine as it just reexports `process` which in the
      // case of cache is the stub
      'process-nextick-args/index.js',

      //
      // Only needed when including app files
      //

      // resuls in recursive call to __get_fs2__
      'packages/https-proxy/lib/ca.js',

      'packages/server/lib/routes-e2e.ts',
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
export async function installSnapshot (
  {
    cypressAppSnapshotDir,
    nodeModulesOnly,
    projectBaseDir,
    snapshotCacheDir,
    snapshotEntryFile,
    snapshotMetaPrevFile,
    usePreviousSnapshotMetadata,
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
    })

    await snapshotGenerator.createScript()
    const { v8ContextFile } = await snapshotGenerator.makeSnapshot()

    const cypressAppSnapshotFile = path.join(
      cypressAppSnapshotDir,
      v8ContextFile,
    )

    await fs.copyFile(
      path.join(projectBaseDir, v8ContextFile),
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
