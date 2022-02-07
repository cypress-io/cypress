import assert from 'assert'
import chalk from 'chalk'
import _ from 'lodash'
import stripAnsi from 'strip-ansi'
import { trimMultipleNewLines } from './errorUtils'
import { stripIndent } from './stripIndent'

import type { ErrTemplateResult, SerializedError } from './errorTypes'

interface ListOptions {
  prefix?: string
  color?: Function
}

const theme = {
  blue: chalk.blueBright,
  gray: chalk.gray,
  white: chalk.white,
  yellow: chalk.yellow,
  magenta: chalk.magentaBright,
}

export const fmt = {
  meta: theme.gray,
  path: theme.blue,
  code: theme.blue,
  url: theme.blue,
  flag: theme.magenta,
  highlight: theme.yellow,
  highlightSecondary: theme.magenta,
  highlightTertiary: theme.blue,
  off: guard,
  stringify,
  terminal,
  listItem,
  listItems,
  listFlags,
  stackTrace,
  cypressVersion,
}

function terminal (str: string) {
  return guard(`${theme.gray('$')} ${theme.blue(str)}`)
}

function cypressVersion (version: string) {
  const parts = version.split('.')

  if (parts.length !== 3) {
    throw new Error('Cypress version provided must be in x.x.x format')
  }

  return `Cypress version ${version}`
}

function _item (item: string, options: ListOptions = {}) {
  const { prefix, color } = _.defaults(options, {
    prefix: '',
    color: theme.blue,
  })

  return stripIndent`${theme.gray(prefix)}${color(item)}`
}

function listItem (item: string, options: ListOptions = {}) {
  _.defaults(options, {
    prefix: '  > ',
  })

  return guard(_item(item, options))
}

function listItems (items: string[], options: ListOptions = {}) {
  _.defaults(options, {
    prefix: ' - ',
  })

  return guard(items
  .map((item) => _item(item, options))
  .join('\n'))
}

function listFlags (
  obj: Record<string, string | undefined | null>,
  mapper: Record<string, string>,
) {
  return guard(_
  .chain(mapper)
  .map((flag, key) => {
    const v = obj[key]

    if (v) {
      return `The ${flag} flag you passed was: ${theme.yellow(v)}`
    }

    return undefined
  })
  .compact()
  .join('\n')
  .value())
}

export class Guard {
  constructor (readonly val: string | number) {}
}

/**
 * Prevents a string from being colored "blue" when wrapped in the errTemplate
 * tag template literal
 */
export function guard (val: string | number) {
  return new Guard(val)
}

export class Backtick {
  constructor (readonly val: string | number) {}
}

export function backtick (val: string) {
  return new Backtick(val)
}

export class Stringify {
  constructor (readonly val: any) {}
}

export function stringify (val: object) {
  return new Stringify(val)
}

/**
 * Marks the value as "details". This is when we print out the stack trace to the console
 * (if it's an error), or use the stack trace as the originalError
 */
export class StackTrace {
  /**
   * @param {string | Error | object} stackTrace
   */
  constructor (readonly val: string | Error | object) {}
}

export function stackTrace (val: string | Error | object) {
  return new StackTrace(val)
}

export function isErrorLike (err: any): err is SerializedError | Error {
  return err && typeof err === 'object' && Boolean('name' in err && 'message' in err)
}

function jsonStringify (obj: object) {
  return JSON.stringify(obj, null, 2)
}

function isScalar (val: any): val is string | number | null | boolean {
  return typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean' ||
    val == null
}

/**
 * Formats the value passed in via details(), but does not color the value here, since it
 * is printed separately in the console.
 *
 * @param val
 * @returns
 */
function formatMsgDetails (val: any): string {
  return isScalar(val)
    ? `${val}`
    : isErrorLike(val)
      ? val.stack || val.message || val.name
      : jsonStringify(val)
}

/**
 * Creates a consistently formatted object to return from the error call.
 *
 * For the console:
 *   - By default, wrap every arg in yellow, unless it's "guarded" or is a "details"
 *   - Details stack gets logged at the end of the message in gray | magenta
 *
 * For the browser:
 *   - Wrap every arg in backticks, for better rendering in markdown
 *   - If details is an error, it gets provided as originalError
 */
export const errTemplate = (strings: TemplateStringsArray, ...args: Array<string | number | Error | StackTrace | Guard | object>): ErrTemplateResult => {
  let originalError: Error | undefined = undefined
  let messageDetails: string | undefined

  function prepMessage (forTerminal = true) {
    function formatVal (val: string | number | Error | object | null) {
      // if (isErrorLike(val)) {
      //   return `${val.name}: ${val.message}`
      // }

      if (isScalar(val)) {
        // If it's for the terminal, wrap in blue, otherwise wrap in backticks if we don't see any backticks
        if (forTerminal) {
          return theme.yellow(`${val}`)
        }

        return String(val).includes('`') ? String(val) : `\`${val}\``
      }

      try {
        const objJson = jsonStringify(val)

        return forTerminal ? objJson : stripIndent`
        \`\`\`
        ${objJson}
        \`\`\`
        `
      } catch {
        return String(val)
      }
    }

    let templateArgs: Array<string | number> = []
    let detailsSeen = false

    for (const arg of args) {
      if (arg instanceof Backtick) {
        templateArgs.push(`\`${arg.val}\``)
      } else if (arg instanceof Guard) {
        templateArgs.push(arg.val)
      } else if (arg instanceof Stringify) {
        templateArgs.push(theme.white(jsonStringify(arg.val)))
      } else if (arg instanceof StackTrace) {
        assert(!detailsSeen, `Cannot use details() multiple times in the same errTemplate`)
        detailsSeen = true
        const { val } = arg

        messageDetails = chalk.magenta(formatMsgDetails(val))
        if (isErrorLike(val)) {
          originalError = val
        }

        templateArgs.push('')
      } else if (isErrorLike(arg)) {
        templateArgs.push(chalk.magenta(`${arg.name}: ${arg.message}`))
      } else {
        templateArgs.push(formatVal(arg))
      }
    }

    return stripIndent(strings, ...templateArgs)
  }

  const msg = trimMultipleNewLines(prepMessage())

  return {
    message: msg,
    details: messageDetails,
    originalError,
    forBrowser () {
      const msg = trimMultipleNewLines(prepMessage(false))

      return {
        message: stripAnsi(msg),
      }
    },
  }
}
