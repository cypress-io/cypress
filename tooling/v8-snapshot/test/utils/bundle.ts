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

  const snapshotFile = path.join(cacheDir, 'snapshot.js')

  const snapshotFileContent = fs.readFileSync(snapshotFile, 'utf8')
  const sourcemapComment = snapshotFileContent.split('\n').pop()

  const { snapshotResult, snapshotAuxiliaryData } = eval(
    `(function () {\n${snapshotFileContent};\n return { snapshotResult, snapshotAuxiliaryData };})()`,
  )

  return { meta, snapshotResult, snapshotAuxiliaryData, sourcemapComment }
}
