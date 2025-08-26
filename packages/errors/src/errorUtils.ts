/* eslint-disable no-console */
import chalk from 'chalk'
import _ from 'lodash'
import path from 'path'

const pluralize = require('pluralize')
const humanTime = require('@packages/server/lib/util/human_time')

import type { CypressError, ErrorLike } from './errorTypes'
import { serializeError as serializeErrorToObject, isErrorLike } from 'serialize-error'

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
  if (typeof error === 'object' && error !== null) {
    // Handle Error objects specially using isErrorLike for robust detection
    if (isErrorLike(error)) {
      return error.message || error.toString()
    }

    // Handle RegExp objects
    if (error instanceof RegExp) {
      return error.toString()
    }

    // Use serialize-error for safe object serialization (handles circular refs)
    return JSON.stringify(serializeErrorToObject(error))
  }

  return String(error)
}

/**
 * Creates an Error object from any value, ensuring it's always an Error instance
 * This eliminates the need for manual error type checking and creation
 */
export const ensureError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error
  }

  return new Error(serializeError(error))
}

/**
 * Deep serializes arguments to avoid [object Object] issues
 * Useful for method arguments that need to be logged or reported
 */
export const serializeArguments = (args: unknown[]): unknown[] => {
  return args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      // Handle Error objects specially using isErrorLike for robust detection
      if (isErrorLike(arg)) {
        return serializeErrorToObject(arg)
      }

      // Handle RegExp objects
      if (arg instanceof RegExp) {
        return arg.toString()
      }

      try {
        // Use serialize-error for safe object serialization (handles circular refs)
        return JSON.parse(JSON.stringify(serializeErrorToObject(arg)))
      } catch {
        // If parsing fails, fall back to string conversion
        return String(arg)
      }
    }

    // Handle functions and symbols
    if (typeof arg === 'function') {
      return String(arg)
    }

    if (typeof arg === 'symbol') {
      return String(arg)
    }

    return arg
  })
}

/**
 * Safely serializes arguments to a JSON string, handling circular references
 * This replaces manual JSON.stringify calls that might fail
 */
export const serializeArgumentsToString = (args: unknown[]): string => {
  try {
    const serialized = serializeArguments(args)

    return JSON.stringify({ args: serialized })
  } catch (e: unknown) {
    return `Unknown args: ${e}`
  }
}
