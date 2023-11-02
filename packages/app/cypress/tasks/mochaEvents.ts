import path from 'path'
import fs from 'fs-extra'

export function writeMochaEventSnapshot ({ filename, snapshots }) {
  const snapshotsFolder = path.join(__dirname, '..', 'e2e', 'runner', 'snapshots')
  const jsonFile = path.join(snapshotsFolder, `${filename}.json`)

  fs.writeFileSync(jsonFile, JSON.stringify(snapshots, null, 2))

  return null
}

export function readMochaEventSnapshot ({ filename }) {
  const snapshotsFolder = path.join(__dirname, '..', 'e2e', 'runner', 'snapshots')
  const jsonFile = path.join(snapshotsFolder, `${filename}.json`)

  if (!fs.existsSync(jsonFile)) {
    fs.ensureFileSync(jsonFile)
    fs.writeJsonSync(jsonFile, {})
  }

  return fs.readJsonSync(jsonFile)
}
