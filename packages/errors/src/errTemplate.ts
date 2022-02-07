import chalk from 'chalk'
import _ from 'lodash'
import { trimMultipleNewLines } from './errorUtils'
import { stripIndent } from './stripIndent'

import type { ErrTemplateResult, SerializedError } from './errorTypes'
import assert from 'assert'

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

type AllowedPartialArg = Guard | Format | PartialErr | null

type AllowedTemplateArg = StackTrace | AllowedPartialArg

class PartialErr {
  constructor (readonly strArr: TemplateStringsArray, readonly args: AllowedTemplateArg[]) {}
}

interface FormatConfig {
  block: true
}

type ToFormat = string | number | Error | object | null | Guard | AllowedTemplateArg

class Format {
  constructor (readonly type: keyof typeof fmtHighlight, readonly val: ToFormat, readonly config?: FormatConfig) {}

  formatVal (target: 'ansi' | 'markdown') {
    if (this.val instanceof Guard) {
      return this.val.val
    }

    return target === 'ansi' ? this.formatAnsi() : this.formatMarkdown()
  }

  private formatAnsi () {
    const val = this.prepVal('ansi')

    return fmtHighlight[this.type](val)
  }

  private formatMarkdown () {
    if (this.type === 'code') {
      return this.prepVal('markdown')
    }

    return mdFence(this.prepVal('markdown'))
  }

  private prepVal (target: 'ansi' | 'markdown'): string {
    if (this.val instanceof PartialErr) {
      return prepMessage(this.val.strArr, this.val.args, target)
    }

    if (isErrorLike(this.val)) {
      return `\n${this.val.name}: ${this.val.message}`
    }

    if (this.val && (typeof this.val === 'object' || Array.isArray(this.val))) {
      return JSON.stringify(this.val, null, 2)
    }

    return `${this.val}`
  }
}

function mdFence (val: string) {
  if (isMultiLine(val)) {
    return `\`\`\`${val}\`\`\``
  }

  return `\`${val}\``
}

function isMultiLine (val: string) {
  return Boolean(val.split('\n').length > 1)
}

function makeFormat (type: keyof typeof fmtHighlight, config?: FormatConfig) {
  return (val: ToFormat) => {
    return new Format(type, val, config)
  }
}

const fmtHighlight = {
  meta: theme.gray,
  comment: theme.gray,
  path: theme.blue,
  code: theme.blue,
  url: theme.blue,
  flag: theme.magenta,
  highlight: theme.yellow,
  highlightSecondary: theme.magenta,
  highlightTertiary: theme.blue,
} as const

export const fmt = {
  meta: makeFormat('meta'),
  comment: makeFormat('comment'),
  path: makeFormat('path'),
  code: makeFormat('code', { block: true }),
  url: makeFormat('url'),
  flag: makeFormat('flag'),
  highlight: makeFormat('highlight'),
  highlightSecondary: makeFormat('highlightSecondary'),
  highlightTertiary: makeFormat('highlightTertiary'),
  off: guard,
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

  return guard(`Cypress version ${version}`)
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

/**
 * Creates a "partial" that can be interpolated into the full Error template. The partial runs through
 * stripIndent prior to being added into the template
 */
export const errPartial = (templateStr: TemplateStringsArray, ...args: AllowedPartialArg[]) => {
  return new PartialErr(templateStr, args)
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
export const errTemplate = (strings: TemplateStringsArray, ...args: AllowedTemplateArg[]): ErrTemplateResult => {
  let originalError: Error | undefined = undefined

  const msg = trimMultipleNewLines(prepMessage(strings, args, 'ansi'))

  return {
    message: msg,
    originalError,
    messageMarkdown: trimMultipleNewLines(prepMessage(strings, args, 'markdown')),
  }
}

function prepMessage (templateStrings: TemplateStringsArray, args: AllowedTemplateArg[], target: 'ansi' | 'markdown'): string {
  let originalError: Error | undefined = undefined
  const templateArgs = []

  for (const arg of args) {
    // We assume null/undefined values are skipped when rendering, for conditional templating
    if (arg == null) {
      templateArgs.push('')
    } else if (arg instanceof Guard) {
      // Guard prevents any formatting
      templateArgs.push(arg.val)
    } else if (arg instanceof Format) {
      // Format = stringify & color ANSI, or make a markdown block
      templateArgs.push(arg.formatVal(target))
    } else if (arg instanceof StackTrace) {
      if (isErrorLike(arg.val)) {
        assert(!originalError, `Cannot use fmt.stackTrace() multiple times in the same errTemplate`)
        originalError = arg.val
      } else {
        if (process.env.CYPRESS_INTERNAL_ENV !== 'production') {
          throw new Error(`Cannot use arg.stackTrace with a non error-like value, saw ${JSON.stringify(arg.val)}`)
        }

        const err = new Error()

        err.stack = typeof arg.val === 'string' ? arg.val : JSON.stringify(arg.val)
        originalError = err
      }
    } else if (arg instanceof PartialErr) {
      // Partial error = prepMessage + interpolate
      templateArgs.push(prepMessage(arg.strArr, arg.args, target))
    } else {
      throw new Error(`Invalid value passed to prepMessage, saw ${arg}`)
    }
  }

  return stripIndent(templateStrings, ...templateArgs)
}
