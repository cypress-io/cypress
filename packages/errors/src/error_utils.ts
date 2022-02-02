/* eslint-disable no-console */
import chalk from 'chalk'
import _ from 'lodash'

import type { CypressError, ErrorLike } from './errorTypes'
import { guard } from './err_template'
import { stripIndent } from './strip_indent'

export const isCypressErr = (err: ErrorLike): err is CypressError => {
  return Boolean(err.isCypressErr)
}

export const listItems = (paths: string[]) => {
  return guard(_
  .chain(paths)
  .map((p) => {
    return stripIndent`- ${chalk.blue(p)}`
  }).join('\n')
  .value())
}

export const displayFlags = (obj: Record<string, string | undefined | null>, mapper: Record<string, string>) => {
  return guard(_
  .chain(mapper)
  .map((flag, key) => {
    let v

    v = obj[key]

    if (v) {
      return `The ${flag} flag you passed was: ${chalk.blue(v)}`
    }

    return undefined
  }).compact()
  .join('\n')
  .value())
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
    console.log(`\n${chalk['yellow'](err.details)}`)
  }

  // bail if this error came from known
  // list of Cypress errors
  if (isCypressErr(err)) {
    return
  }

  console.log(chalk[color](err.stack ?? ''))

  return err
}

export const warnIfExplicitCiBuildId = function (ciBuildId?: string | null) {
  if (!ciBuildId) {
    return ''
  }

  return `\
It also looks like you also passed in an explicit --ci-build-id flag.

This is only necessary if you are NOT running in one of our supported CI providers.

This flag must be unique for each new run, but must also be identical for each machine you are trying to --group or run in --parallel.\
`
}
