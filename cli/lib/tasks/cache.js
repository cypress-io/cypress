const { execSync } = require('child_process')
const state = require('./state')
const logger = require('../logger')
const fs = require('../fs')
const util = require('../util')

const path = () => {
  logger.log(state.getCacheDir())

  return undefined
}

const clear = () => {
  return fs.removeAsync(state.getCacheDir())
}

const list = () => {
  const cacheDir = state.getCacheDir()

  return getCachedVersions(cacheDir)
  .then((versions) => {
    versions.forEach(async (version) => {
      const size = await execSync(`du -hs ${cacheDir}/${version}`)

      logger.log(`${version}: ${size.toString().split(/\t/)[0]}`)
    })
  })
}

const getCachedVersions = (cacheDir) => {
  return fs
  .readdirAsync(cacheDir || state.getCacheDir())
  .filter(util.isSemver)
}

module.exports = {
  path,
  clear,
  list,
  getCachedVersions,
}
