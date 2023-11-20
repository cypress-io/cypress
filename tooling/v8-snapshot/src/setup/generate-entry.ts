import { generateSnapshotEntryFromEntryDependencies } from '../generator/snapshot-generate-entry-via-dependencies'
import debug from 'debug'
import { ensureDirSync } from '../utils'
import path from 'path'

const logInfo = debug('cypress:snapgen:info')
const logError = debug('cypress:snapgen:error')

/**
 * Generates the snapshot entry file by following all dependencies of
 * the `appEntryFile` via `v8-snapshot`.
 *
 * @param {Partial<import('../snapconfig').SnapshotConfig>} opts
 */
export async function generateEntry ({
  appEntryFile,
  nodeModulesOnly,
  pathsMapper,
  projectBaseDir,
  snapshotEntryFile,
  integrityCheckSource,
}: {
  appEntryFile: string
  nodeModulesOnly: boolean
  pathsMapper: (file: string) => string
  projectBaseDir: string
  snapshotEntryFile: string
  integrityCheckSource: string | undefined
}): Promise<void> {
  logInfo('Creating snapshot generation entry file %o', { nodeModulesOnly })

  try {
    ensureDirSync(path.dirname(snapshotEntryFile))

    await generateSnapshotEntryFromEntryDependencies(
      projectBaseDir,
      snapshotEntryFile,
      {
        entryFile: appEntryFile,
        pathsMapper,
        nodeModulesOnly,
        integrityCheckSource,
      },
    )

    logInfo('Done creating snapshot generation entry file')
  } catch (err) {
    logError(err)
    throw err
  }
}
