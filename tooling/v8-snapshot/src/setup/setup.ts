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
    process.exit(err.code ?? 1)
  }
}

setupV8Snapshots()
