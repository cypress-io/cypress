import assert from 'assert'
import { stripIndent } from './stripIndent'

/**
 * Guarding the value, involves
 */
import chalk from 'chalk'
import stripAnsi from 'strip-ansi'
import { trimMultipleNewLines } from './errorUtils'
import type { ErrTemplateResult, SerializedError } from './errorTypes'

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

export function isErrorLike (err: any): err is SerializedError | Error {
  return err && typeof err === 'object' && Boolean('name' in err && 'message' in err)
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
  let messageDetails: string | undefined

  function prepMessage (forTerminal = true) {
    function isScalar (val: any): val is string | number | null | boolean {
      return typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' || val == null
    }

    function formatVal (val: string | number | Error | object | null) {
      if (isErrorLike(val)) {
        return `${val.name}: ${val.message}`
      }

      if (isScalar(val)) {
        // If it's for the terminal, wrap in blue, otherwise wrap in backticks if we don't see any backticks
        return forTerminal ? chalk.blue(`${val}`) : String(val).includes('`') ? String(val) : `\`${val}\``
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

    /**
     * Formats the value passed in via details(), but does not color the value here, since it
     * is printed separately in the console.
     *
     * @param val
     * @returns
     */
    function formatMsgDetails (val: any): string {
      return isScalar(val) ? `${val}` : isErrorLike(val) ? val.stack || val.message || val.name : JSON.stringify(val, null, 2)
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
        if (isErrorLike(val)) {
          originalError = val
        }

        templateArgs.push('')
      } else if (isErrorLike(arg)) {
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
    originalError,
    forBrowser () {
      const msg = trimMultipleNewLines(prepMessage(false))

      return {
        message: stripAnsi(msg),
      }
    },
  }
}
