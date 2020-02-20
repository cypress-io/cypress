const state = require('./state')
const logger = require('../logger')
const fs = require('../fs')
const util = require('../util')
const { join } = require('path')
const Table = require('cli-table3')
const moment = require('moment')
const chalk = require('chalk')

// color for numbers and show values
const g = chalk.green
// last used color
const u = chalk.cyan

// TODO: rename this function
const path = () => {
  logger.log(state.getCacheDir())

  return undefined
}

const clear = () => {
  return fs.removeAsync(state.getCacheDir())
}

const list = () => {
  return getCachedVersions()
  .then((binaries) => {
    const table = new Table({
      head: ['version', 'last used'],
    })

    binaries.forEach((x) => {
      const versionString = g(x.version)
      const lastUsed = x.accessed ? u(x.accessed) : 'unknown'

      return table.push([versionString, lastUsed])
    })

    logger.log(table.toString())
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
      const accessed = moment(stat.atime).fromNow()

      binary.accessed = accessed

      return binary
    }, (e) => {
      // could not find the binary or gets its stats
      return binary
    })
  })
}

module.exports = {
  path,
  clear,
  list,
  getCachedVersions,
}
