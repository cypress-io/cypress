import path from 'path'
import fs from 'fs-extra'

export function readBundleResult (cacheDir: string) {
  const metaFile = path.join(cacheDir, 'snapshot-meta.json')
  const snapshotBundleFile = path.join(cacheDir, 'snapshot-bundle.js')
  const meta = require(metaFile)
  const exported = require(snapshotBundleFile)

  return { meta, exported }
}

export function readSnapshotResult (cacheDir: string) {
  const metaFile = path.join(cacheDir, 'snapshot-meta.json')
  const meta = fs.readJSONSync(metaFile)

  return { meta }
}
