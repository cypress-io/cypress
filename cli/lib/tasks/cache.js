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
  return getCachedVersions()
  .then((versions) => {
    logger.log(versions.join(', '))
  })
}

const getCachedVersions = () => {
  return fs
  .readdirAsync(state.getCacheDir())
  .filter(util.isSemver)
}

module.exports = {
  path,
  clear,
  list,
  getCachedVersions,
}
