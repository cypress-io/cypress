import { createConfig, getSnapshotCacheDir } from './config'
import { consolidateDeps } from './consolidate-deps'
import { generateMetadata } from './generate-metadata'
import minimist from 'minimist'
import { generateEntry } from './generate-entry'
import { installSnapshot } from './install-snapshot'

const setupV8Snapshots = async ({ cypressAppPath, integrityCheckSource, supportCypressInCypress, useExistingSnapshotScript, updateSnapshotScriptContents }: { cypressAppPath?: string, integrityCheckSource?: string, supportCypressInCypress?: boolean, useExistingSnapshotScript?: boolean, updateSnapshotScriptContents?: (contents: string) => string } = {}) => {
  try {
    const args = minimist(process.argv.slice(2))
    const config = createConfig({ env: args.env, cypressAppPath, integrityCheckSource, supportCypressInCypress, useExistingSnapshotScript, updateSnapshotScriptContents })

    await consolidateDeps(config)

    const meta = await generateMetadata(config)

    await generateEntry(config)
    const snapshotFileLocation = await installSnapshot(config, meta.resolverMap)

    return snapshotFileLocation
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Snapshot generation has failed. If you continue to see this error, you can generate snapshots from scratch by running:

  \`V8_SNAPSHOT_FROM_SCRATCH=1 yarn build-v8-snapshot-{prod or dev}\`

Note that this may take a while.

Alternatively, you can run the Update V8 Snapshot Cache github action against your branch to generate the snapshots for you on all platforms: https://github.com/cypress-io/cypress/actions/workflows/update_v8_snapshot_cache.yml`)

    process.exit(1)
  }
}

export { setupV8Snapshots, consolidateDeps, getSnapshotCacheDir }
