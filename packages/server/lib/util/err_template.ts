import assert from 'assert'
/**
 * Guarding the value, involves
 */
import chalk from 'chalk'
import stripAnsi from 'strip-ansi'
import { trimMultipleNewLines } from '../errors-child'

const { stripIndent } = require('./strip_indent')

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

export function backtick (val) {
  return new Backtick(val)
}

/**
 * Marks the value as "details". This is when we print out the stack trace to the console
 * (if it's an error), or use the stack trace as the originalError
 */
export class Details {
  /**
   * @param {string | Error | object} details
   */
  constructor (readonly val: string | Error | object) {}
}

export function details (val: string | Error | object) {
  return new Details(val)
}

export interface ErrTemplateResult {
  message: string
  details?: string
  originalError?: Error
  forBrowser(): {
    message: string
    details?: string
  }
}

/**
 * Creates a consistently formatted object to return from the error call.
 *
 * For the console:
 *   - By default, wrap every arg in chalk.blue, unless it's "guarded" or is a "details"
 *   - Details stack gets logged at the end of the message in yellow
 *
 * For the browser:
 *   - Wrap every arg in backticks, for better rendering in markdown
 *   - If details is an error, it gets provided as originalError
 */
export const errTemplate = (strings: TemplateStringsArray, ...args: Array<string | number | Error | Details | Guard | object>): ErrTemplateResult => {
  let originalError: Error | undefined = undefined
  let messageDetails

  function prepMessage (forTerminal = true) {
    function isScalar (val: any): val is string | number | null | boolean {
      return typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' || val == null
    }

    function formatVal (val: string | number | Error | object | null) {
      if (val instanceof Error) {
        return `${val.name}: ${val.message}`
      }

      if (isScalar(val)) {
        return forTerminal ? chalk.blue(`${val}`) : `\`${val}\``
      }

      try {
        const objJson = JSON.stringify(val, null, 2)

        return forTerminal ? objJson : stripIndent`
        \`\`\`
        ${objJson}
        \`\`\`
        `
      } catch {
        return String(val)
      }
    }

    function formatMsgDetails (val: any) {
      return isScalar(val) ? val : val instanceof Error ? val.stack || val.message : JSON.stringify(val, null, 2)
    }

    let templateArgs: Array<string | number> = []
    let detailsSeen = false

    for (const arg of args) {
      if (arg instanceof Backtick) {
        templateArgs.push(`\`${arg.val}\``)
      } else if (arg instanceof Guard) {
        templateArgs.push(arg.val)
      } else if (arg instanceof Details) {
        assert(!detailsSeen, `Cannot use details() multiple times in the same errTemplate`)
        detailsSeen = true
        const { val } = arg

        messageDetails = formatMsgDetails(val)
        if (val instanceof Error) {
          originalError = val
        }

        templateArgs.push('')
      } else if (arg instanceof Error) {
        templateArgs.push(chalk.red(`${arg.name}: ${arg.message}`))
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
    forBrowser () {
      const msg = trimMultipleNewLines(prepMessage(false))

      return {
        originalError,
        message: stripAnsi(msg),
        details: messageDetails,
      }
    },
  }
}
