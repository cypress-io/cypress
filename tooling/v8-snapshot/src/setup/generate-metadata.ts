import { writeFileSync } from 'fs'
import { BundlerMetadata, generateBundlerMetadata } from '../generator/snapshot-generate-entry-via-dependencies'
import debug from 'debug'
import { ensureDirSync } from 'fs-extra'
import path from 'path'

const logInfo = debug('cypress:snapgen:info')
const logDebug = debug('cypress:snapgen:debug')
const logError = debug('cypress:snapgen:error')

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
 * @return {Promise<import('v8-snapshot').BundlerMetadata>} metadata
 */
export async function generateMetadata ({
  appEntryFile,
  metaFile,
  nodeModulesOnly,
  pathsMapper,
  projectBaseDir,
  snapshotEntryFile,
}: {
  appEntryFile: string
  metaFile: string
  nodeModulesOnly: boolean
  pathsMapper: (file: string) => string
  projectBaseDir: string
  snapshotEntryFile: string
}): Promise<BundlerMetadata> {
  try {
    logInfo('Creating snapshot metadata %o', { nodeModulesOnly })

    const meta = await createMeta({
      appEntryFile,
      nodeModulesOnly,
      pathsMapper,
      projectBaseDir,
      snapshotEntryFile,
    })

    ensureDirSync(path.dirname(metaFile))
    writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf8')
    logDebug('Written to', metaFile)

    logInfo('Done creating snapshot metadata')

    return meta
  } catch (err) {
    logError(err)
    throw err
  }
}
