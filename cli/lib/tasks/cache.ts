import state from './state'
import logger from '../logger'
import fs from '../fs'
import util from '../util'

import { join } from 'path'
import Table from 'cli-table3'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import chalk from 'chalk'
import _ from 'lodash'
import getFolderSize from './get-folder-size'

dayjs.extend(relativeTime)

// output colors for the table
const colors = {
  titles: chalk.white,
  dates: chalk.cyan,
  values: chalk.green,
  size: chalk.gray,
}

const logCachePath = (): undefined => {
  logger.always(state.getCacheDir())

  return undefined
}

const clear = (): Promise<void> => {
  return fs.removeAsync(state.getCacheDir())
}

const prune = async (): Promise<void> => {
  const cacheDir = state.getCacheDir()
  const checkedInBinaryVersion = util.pkgVersion()

  let deletedBinary = false

  try {
    const versions = await fs.readdirAsync(cacheDir)

    for (const version of versions) {
      if (version !== checkedInBinaryVersion) {
        deletedBinary = true

        const versionDir = join(cacheDir, version)

        await fs.removeAsync(versionDir)
      }
    }

    if (deletedBinary) {
      logger.always(`Deleted all binary caches except for the ${checkedInBinaryVersion} binary cache.`)
    } else {
      logger.always(`No binary caches found to prune.`)
    }
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      logger.always(`No Cypress cache was found at ${cacheDir}. Nothing to prune.`)

      return
    }

    throw e
  }
}

const fileSizeInMB = (size: number): string => {
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}

/**
 * Collects all cached versions, finds when each was used
 * and prints a table with results to the terminal
 */
const list = (showSize: boolean = false): any => {
  return getCachedVersions(showSize)
  .then((binaries: any) => {
    const head = [colors.titles('version'), colors.titles('last used')]

    if (showSize) {
      head.push(colors.titles('size'))
    }

    const table = new Table({
      head,
    })

    binaries.forEach((binary: any) => {
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

const getCachedVersions = (showSize: boolean): Promise<any> => {
  const cacheDir = state.getCacheDir()

  return fs
  .readdirAsync(cacheDir)
  .filter(util.isSemver)
  .map((version: any) => {
    return {
      version,
      folderPath: join(cacheDir, version),
    }
  })
  .mapSeries((binary: any) => {
    // last access time on the folder is different from last access time
    // on the Cypress binary
    const binaryDir = state.getBinaryDir(binary.version)
    const executable = state.getPathToExecutable(binaryDir)

    return fs.statAsync(executable).then((stat: any) => {
      const lastAccessedTime = _.get(stat, 'atime')

      if (!lastAccessedTime) {
        // the test runner has never been opened
        // or could be a test simulating missing timestamp
        return binary
      }

      const accessed = dayjs(lastAccessedTime).fromNow()

      binary.accessed = accessed

      return binary
    }, (e: any) => {
      // could not find the binary or gets its stats
      return binary
    })
  })
  .mapSeries((binary: any) => {
    if (showSize) {
      const binaryDir = state.getBinaryDir(binary.version)

      return getFolderSize(binaryDir).then((size: number) => {
        return {
          ...binary,
          size,
        }
      })
    }

    return binary
  })
}

const cacheModule = {
  path: logCachePath,
  clear,
  prune,
  list,
  getCachedVersions,
}

export default cacheModule
