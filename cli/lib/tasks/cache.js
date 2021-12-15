const state = require('./state')
const logger = require('../logger')
const fs = require('../fs')
const util = require('../util')
const { join } = require('path')
const Table = require('cli-table3')
const dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
const chalk = require('chalk')
const getFolderSize = require('./get-folder-size')
const registry = require('../registry')

const MAX_BINARY_AGE = 90 //Days

const reservedCacheKeys = [
  'registry',
  'cy',
]

dayjs.extend(relativeTime)

// output colors for the table
const colors = {
  titles: chalk.white,
  dates: chalk.cyan,
  values: chalk.green,
  size: chalk.gray,
}

const logCachePath = () => {
  logger.always(state.getCacheDir())

  return undefined
}

const clear = () => {
  return fs.removeAsync(state.getCacheDir())
}

const pruneCypressVersions = async ({ cacheDir, registeredVersions }) => {
  let versions

  // Read the cache dir
  try {
    versions = await fs.readdirAsync(cacheDir)
  } catch (e) {
    if (e === 'ENOENT') {
      return []
    }

    throw e
  }

  return versions.reduce(async (accumulatorPromise, version) => {
    const acc = await accumulatorPromise

    // ignore reserved cache keys since they are mixed with cypress versions and registered cypress versions.
    if (!reservedCacheKeys.includes(version) && !registeredVersions.has(version)) {
      // If the version is 9.x or lower, check the atime since those versions don't register themselves.
      if (version.match(/^\d\./)) {
        const binaryDir = state.getBinaryDir(version)
        const executable = state.getPathToExecutable(binaryDir)
        const stat = await fs.statAsync(executable)

        // If the binary was created or accessed in the last 90 days, don't prune it.
        const binaryTime = stat.atime || stat.birthtime
        const diff = Date.now() - new Date(binaryTime).valueOf()

        //convert days to milliseconds.
        if (diff < (MAX_BINARY_AGE * 86400000)) {
          return acc
        }
      }

      acc.push(version)

      const versionDir = join(cacheDir, version)

      await fs.removeAsync(versionDir)
    }

    return acc
  }, [])
}

const prune = async () => {
  const cacheDir = state.getCacheDir()
  let deletedBinaries = []

  try {
    const registeredBinaries = await registry.registeredBinaries()

    await pruneCypressVersions({ cacheDir, registeredVersions: registeredBinaries.cypress })
  } catch (e) {
    logger.always('Failed to prune cache')

    throw e
  }

  if (deletedBinaries.length > 0) {
    logger.always(`Pruned Cypress version(s) ${deletedBinaries.join(', ')} from the binary cache.`)
  } else {
    logger.always(`No binary caches found to prune.`)
  }
}

const fileSizeInMB = (size) => {
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}

/**
 * Collects all cached versions, finds when each was used
 * and prints a table with results to the terminal
 */
const list = (showSize) => {
  return getCachedVersions(showSize)
  .then((binaries) => {
    const head = [colors.titles('version'), colors.titles('last used')]

    if (showSize) {
      head.push(colors.titles('size'))
    }

    const table = new Table({
      head,
    })

    binaries.forEach((binary) => {
      const versionString = colors.values(binary.version)
      const lastUsed = binary.accessed ? colors.dates(binary.accessed) : 'unknown'
      const row = [versionString, lastUsed]

      if (showSize) {
        const size = colors.size(fileSizeInMB(binary.size))

        row.push(size)
      }

      return table.push(row)
    })

    logger.always(table.toString())
  })
}

const getCachedVersions = (showSize) => {
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
      const lastAccessedTime = stat.atime

      if (!lastAccessedTime) {
        // the test runner has never been opened
        // or could be a test simulating missing timestamp
        return binary
      }

      const accessed = dayjs(lastAccessedTime).fromNow()

      binary.accessed = accessed

      return binary
    }, (e) => {
      // could not find the binary or gets its stats
      return binary
    })
  })
  .mapSeries((binary) => {
    if (showSize) {
      const binaryDir = state.getBinaryDir(binary.version)

      return getFolderSize(binaryDir).then((size) => {
        return {
          ...binary,
          size,
        }
      })
    }

    return binary
  })
}

module.exports = {
  path: logCachePath,
  clear,
  prune,
  list,
  getCachedVersions,
}
