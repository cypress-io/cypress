/* eslint-disable no-console */
import chalk from 'chalk'
import _ from 'lodash'
import path from 'path'

const pluralize = require('pluralize')
const humanTime = require('@packages/server/lib/util/human_time')

import type { CypressError, ErrorLike } from './errorTypes'

export {
  pluralize,
  humanTime,
}

const whileMatching = (othArr: string[]) => {
  return (val: string, index: number) => {
    return val === othArr[index]
  }
}

export const parseResolvedPattern = (baseFolder: string, globPattern: string) => {
  const resolvedPath = path.resolve(baseFolder, globPattern)
  const resolvedPathParts = resolvedPath.split(path.sep)
  const folderPathPaths = baseFolder.split(path.sep)
  const commonPath = _.takeWhile(folderPathPaths, whileMatching(resolvedPathParts)).join(path.sep)
  const remainingPattern = !commonPath ? resolvedPath : resolvedPath.replace(commonPath.concat(path.sep), '')

  return [commonPath, remainingPattern]
}

export const isCypressErr = (err: ErrorLike): err is CypressError => {
  return Boolean(err.isCypressErr)
}

const twoOrMoreNewLinesRe = /\n{2,}/

export const trimMultipleNewLines = (str: string) => {
  return _
  .chain(str)
  .split(twoOrMoreNewLinesRe)
  .compact()
  .join('\n\n')
  .value()
}

type AllowedChalkColors = 'red' | 'blue' | 'green' | 'magenta' | 'yellow'

/**
 *
 * @param err
 * @param color
 * @param causeDepth If error has a `cause` limits the maximum depth of causes to log. Set to `0` to not log any `cause`
 * @returns
 */
export const logError = function (err: CypressError | ErrorLike, color: AllowedChalkColors = 'red', causeDepth: number = 3) {
  console.log(chalk[color](err.message))

  if (err.details) {
    console.log(chalk.magenta(`\n${err.details}`))
  }

  // bail if this error came from known
  // list of Cypress errors
  if (isCypressErr(err)) {
    return
  }

  console.log(chalk[color](err.stack ?? ''))

  if (causeDepth > 0 && err['cause']) {
    // Limit the recursions on `cause` in case there is a loop
    console.log(chalk[color]('Caused by:'))
    logError(err['cause'], color, causeDepth - 1)
  }

  return err
}

/**
 * Safely serializes an error or object to a string representation
 * This prevents [object Object] issues when reporting errors to Sentry
 */
export const serializeError = (error: unknown): string => {
  try {
    if (typeof error === 'object' && error !== null) {
      return JSON.stringify(error)
    }

    return String(error)
  } catch {
    // Fallback if JSON.stringify fails (e.g., circular references)
    return String(error)
  }
}

/**
 * Deep serializes arguments to avoid [object Object] issues
 * Useful for method arguments that need to be logged or reported
 */
export const serializeArguments = (args: unknown[]): unknown[] => {
  return args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.parse(JSON.stringify(arg))
      } catch {
        return String(arg)
      }
    }

    return arg
  })
}
