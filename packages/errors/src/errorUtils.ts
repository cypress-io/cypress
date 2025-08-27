/* eslint-disable no-console */
import chalk from 'chalk'
import _ from 'lodash'
import path from 'path'

const pluralize = require('pluralize')
const humanTime = require('@packages/server/lib/util/human_time')

import type { CypressError, ErrorLike } from './errorTypes'
import { serializeError as serializeErrorToObject, isErrorLike } from 'serialize-error'
import serialize from 'serialize-javascript'

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
 * Safely serializes a SINGLE value (error, object, primitive) to a string representation.
 *
 * Use this when you need a string representation of one thing:
 * - Single error objects: serializeError(new Error('fail')) → "fail"
 * - Single objects: serializeError({name: 'test'}) → "{name:'test'}"
 * - Single primitives: serializeError(42) → "42"
 *
 * This prevents [object Object] issues when reporting errors to Sentry
 * and provides consistent string output for any input type.
 */
export const serializeError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    if (isErrorLike(error)) {
      return error.message || error.toString()
    }

    // This handles RegExp, Date, Function, Set, Map, BigInt, URLs
    try {
      return serialize(error)
    } catch {
      // If serialize-javascript fails (e.g., circular refs), fall back to serialize-error
      try {
        return JSON.stringify(serializeErrorToObject(error))
      } catch {
        // Final fallback for extreme cases
        return String(error)
      }
    }
  }

  return String(error)
}

/**
 * Converts ANY value to a proper Error object, ensuring it's always an Error instance.
 *
 * Use this when you need to guarantee you have an Error object:
 * - Already an Error: ensureError(new Error('fail')) → returns the same Error
 * - String: ensureError('something went wrong') → new Error('something went wrong')
 * - Object: ensureError({message: 'fail'}) → new Error('{message:"fail"}')
 * - Number: ensureError(500) → new Error('500')
 *
 * This eliminates the need for manual error type checking and creation,
 * providing consistent Error objects regardless of input type.
 */
export const ensureError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error
  }

  return new Error(serializeError(error))
}

const serializeObject = (obj: object): unknown => {
  if (isErrorLike(obj)) {
    return serializeErrorToObject(obj)
  }

  try {
    return serialize(obj)
  } catch {
    try {
      return serializeErrorToObject(obj)
    } catch {
      // If even that fails, fall back to string conversion
      return String(obj)
    }
  }
}

/**
 * Deep serializes an ARRAY of arguments, preserving the array structure.
 *
 * Use this when you have multiple arguments that need to be serialized together:
 * - Function arguments: serializeArguments(['user', {id: 123}, new Error('fail')])
 * - Method parameters: serializeArguments([param1, param2, param3])
 * - Event data: serializeArguments([eventType, eventData, timestamp])
 *
 * Returns an array where each element is serialized but maintains its position.
 * This is different from serializeError which converts a single value to a string.
 */
export const serializeArguments = (args: unknown[]): unknown[] => {
  return args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      return serializeObject(arg)
    }

    if (typeof arg === 'function' || typeof arg === 'symbol') {
      return String(arg)
    }

    return arg
  })
}

/**
 * Serializes arguments for debug logging, preserving objects for interactive inspection.
 *
 * This function is specifically designed for debug() calls where you want to:
 * - Keep objects as objects so they can be expanded in the console
 * - Handle functions and symbols by converting them to strings
 * - Preserve primitives as-is
 * - Handle circular references gracefully
 *
 * Use this with debug() calls: debug('message %o', serializeArgumentsForDebug(args))
 * Use serializeArguments() for other serialization needs (logging, storage, etc.)
 */
export const serializeArgumentsForDebug = (args: unknown[]): unknown[] => {
  return args.map((arg) => {
    // Keep objects as objects for interactive inspection
    if (typeof arg === 'object' && arg !== null) {
      return arg
    }

    // Handle functions and symbols by converting them to strings
    if (typeof arg === 'function' || typeof arg === 'symbol') {
      return String(arg)
    }

    // Keep primitives as-is
    return arg
  })
}

/**
 * Safely serializes an ARRAY of arguments to a JSON string, handling circular references.
 *
 * This is a convenience function that combines serializeArguments + JSON.stringify:
 * - First serializes each argument using serializeArguments
 * - Then converts the result to a JSON string
 * - Wraps the result in an {args: [...]} object for clarity
 *
 * Use this when you need a JSON string representation of multiple arguments
 * for logging, storage, or transmission (e.g., to Sentry).
 */
export const serializeArgumentsToString = (args: unknown[]): string => {
  try {
    const serialized = serializeArguments(args)

    return JSON.stringify({ args: serialized })
  } catch (e: unknown) {
    return `Unknown args: ${e}`
  }
}
