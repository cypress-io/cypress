import { config, VersionMeta } from './config'
import { promises as fs } from 'fs'

const { versionMetaPath } = config

export class Metadata {
  constructor (readonly version: string) {}
  _read (): VersionMeta | null {
    try {
      return require(versionMetaPath)
    } catch (err) {
      // On first time running this after install we won't have it yet
      return null
    }
  }

  matchesCurrentConfig (): boolean {
    const downloadedVersion = this._read()

    if (downloadedVersion == null) return false

    const currentVersion: VersionMeta = config.versionMeta(this.version)

    for (let [key, val] of Object.entries(downloadedVersion)) {
      if (currentVersion[key] !== val) return false
    }

    return true
  }

  current () {
    return config.versionMeta(this.version)
  }

  async write () {
    return fs.writeFile(
      versionMetaPath,
      config.versionMetaJSON(this.version),
      'utf8',
    )
  }
}
