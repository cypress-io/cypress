import { createConfig } from './config'
import { consolidateDeps } from './consolidate-deps'
import { genMeta } from './gen-meta'
import minimist from 'minimist'
import { genEntry } from './gen-entry'
import { installSnapshot } from './install-snapshot'
import fs from 'fs-extra'

const setupV8Snapshots = async () => {
  try {
    const args = minimist(process.argv.slice(2))
    const config = createConfig(args.env)

    await consolidateDeps(config)

    const meta = await genMeta(config)

    await genEntry(config)
    const snapshotFileLocation = await installSnapshot(config, meta.resolverMap)

    await fs.copyFile(config.snapshotMetaFile, config.snapshotMetaPrevFile)

    return snapshotFileLocation
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Snapshot generation has failed. If you continue to see this error, you can generate snapshots from scratch by running:
\`V8_SNAPSHOT_FROM_SCRATCH=1 yarn build-v8-snapshot-{prod or dev}\`

Note that this may take a while.`)

    process.exit(1)
  }
}

if (process.env.DISABLE_SNAPSHOT_REQUIRE == null) {
  setupV8Snapshots()
}
