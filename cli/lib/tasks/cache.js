const state = require('./state')
const logger = require('../logger')
const fs = require('../fs')
const util = require('../util')
const { join } = require('path')
const Table = require('cli-table3')
const moment = require('moment')
const chalk = require('chalk')
const _ = require('lodash')

// output colors for the table
const colors = {
  titles: chalk.white,
  dates: chalk.cyan,
  values: chalk.green,
}

const logCachePath = () => {
  logger.always(state.getCacheDir())

  return undefined
}

const clear = () => {
  return fs.removeAsync(state.getCacheDir())
}

/**
 * Collects all cached versions, finds when each was used
 * and prints a table with results to the terminal
 */
const list = () => {
  return getCachedVersions()
  .then((binaries) => {
    const table = new Table({
      head: [colors.titles('version'), colors.titles('last used')],
    })

    binaries.forEach((binary) => {
      const versionString = colors.values(binary.version)
      const lastUsed = binary.accessed ? colors.dates(binary.accessed) : 'unknown'

      return table.push([versionString, lastUsed])
    })

    logger.always(table.toString())
  })
}

const getCachedVersions = () => {
  const cacheDir = state.getCacheDir()

  return fs
  .readdirAsync(cacheDir)
  .filter(util.isSemver)
  .map((version) => {
    return {
      version,
      folderPath: join(cacheDir, version),
    }
  })
  .mapSeries((binary) => {
    // last access time on the folder is different from last access time
    // on the Cypress binary
    const binaryDir = state.getBinaryDir(binary.version)
    const executable = state.getPathToExecutable(binaryDir)

    return fs.statAsync(executable).then((stat) => {
      const lastAccessedTime = _.get(stat, 'atime')

      if (!lastAccessedTime) {
        // the test runner has never been opened
        // or could be a test simulating missing timestamp
        return binary
      }

      const accessed = moment(lastAccessedTime).fromNow()

      binary.accessed = accessed

      return binary
    }, (e) => {
      // could not find the binary or gets its stats
      return binary
    })
  })
}

module.exports = {
  path: logCachePath,
  clear,
  list,
  getCachedVersions,
}
