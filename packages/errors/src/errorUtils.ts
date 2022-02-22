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
 * @returns
 */
export const logError = function (err: CypressError | ErrorLike, color: AllowedChalkColors = 'red') {
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

  return err
}
