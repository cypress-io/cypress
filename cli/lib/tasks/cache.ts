import state from './state'
import logger from '../logger'
import fs from 'fs-extra'
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
  return fs.remove(state.getCacheDir())
}

const prune = async (): Promise<void> => {
  const cacheDir = state.getCacheDir()
  const checkedInBinaryVersion = util.pkgVersion()

  let deletedBinary = false

  try {
    const versions = await fs.readdir(cacheDir)

    for (const version of versions) {
      if (version !== checkedInBinaryVersion) {
        deletedBinary = true

        const versionDir = join(cacheDir, version)

        await fs.remove(versionDir)
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
const list = async (showSize: boolean = false): Promise<void> => {
  const binaries = await getCachedVersions(showSize)

  const head = [colors.titles('version'), colors.titles('last used')]

  if (showSize) {
    head.push(colors.titles('size'))
  }

  const table = new Table({
    head,
  })

  binaries.forEach((binary: { version: string, accessed?: string, size?: number }) => {
    const versionString = colors.values(binary.version)
    const lastUsed = binary.accessed ? colors.dates(binary.accessed) : 'unknown'
    const row = [versionString, lastUsed]

    if (showSize) {
      const size = colors.size(fileSizeInMB(binary.size as number))

      row.push(size)
    }

    return table.push(row)
  })

  logger.always(table.toString())
}

const getCachedVersions = async (showSize: boolean): Promise<{
  version: string
  folderPath: string
  accessed?: string
  size?: number
}[]> => {
  const cacheDir = state.getCacheDir()

  const versions = await fs.readdir(cacheDir)

  const filteredVersions = versions.filter(util.isSemver).map((version: any) => {
    return {
      version,
      folderPath: join(cacheDir, version),
    }
  })

  const binaries: {
    version: string
    folderPath: string
    accessed?: string
    size?: number
  }[] = []

  for (const binary of filteredVersions) {
    const binaryDir = state.getBinaryDir(binary.version)
    const executable = state.getPathToExecutable(binaryDir)

    try {
      const stat = await fs.stat(executable)

      const lastAccessedTime = _.get(stat, 'atime')

      if (lastAccessedTime) {
        const accessed = dayjs(lastAccessedTime).fromNow()

        // @ts-expect-error - accessed is not defined in the type
        binary.accessed = accessed
      }

      // if no lastAccessedTime
      // the test runner has never been opened
      // or could be a test simulating missing timestamp
    } catch (e) {
      // could not find the binary or gets its stats
      // no-op
    }
    if (showSize) {
      const binaryDir = state.getBinaryDir(binary.version)

      const size: number = await getFolderSize(binaryDir)

      binaries.push({
        ...binary,
        size,
      })
    } else {
      binaries.push(binary)
    }
  }

  return binaries
}

const cacheModule = {
  path: logCachePath,
  clear,
  prune,
  list,
  getCachedVersions,
}

export default cacheModule
