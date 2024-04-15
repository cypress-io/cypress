import assert from 'assert'
import chalk from 'chalk'
import _ from 'lodash'
import stripAnsi from 'strip-ansi'
import { trimMultipleNewLines } from './errorUtils'
import { stripIndent } from './stripIndent'

import type { ErrTemplateResult, SerializedError } from './errorTypes'

interface ListOptions {
  prefix?: string
  color?: keyof typeof theme
}

export const theme = {
  blue: chalk.blueBright,
  gray: chalk.gray,
  white: chalk.white,
  yellow: chalk.yellow,
  magenta: chalk.magentaBright,
}

type AllowedPartialArg = Guard | Format | PartialErr | null

type AllowedTemplateArg = StackTrace | AllowedPartialArg

export class PartialErr {
  constructor (readonly strArr: TemplateStringsArray, readonly args: AllowedTemplateArg[]) {}
}

interface FormatConfig {
  block?: true
  color?: typeof theme[keyof typeof theme]
  stringify?: boolean
}

type ToFormat = string | number | Error | object | null | Guard | AllowedTemplateArg

class Format {
  constructor (
    readonly type: keyof typeof fmtHighlight,
    readonly val: ToFormat,
    readonly config: FormatConfig,
  ) {
    this.color = config.color || fmtHighlight[this.type]
  }

  private color: typeof theme[keyof typeof theme]

  formatVal (target: 'ansi' | 'markdown'): string {
    if (this.val instanceof Guard) {
      return `${this.val.val}`
    }

    const str = target === 'ansi' ? this.formatAnsi() : this.formatMarkdown()

    // add a newline to ensure this is on its own line
    return isMultiLine(str) ? `\n\n${str}` : str
  }

  private formatAnsi () {
    const val = this.prepVal('ansi')

    if (this.type === 'terminal') {
      return `${theme.gray('$')} ${this.color(val)}`
    }

    return this.color(val)
  }

  private formatMarkdown () {
    if (this.type === 'comment') {
      return `${this.val}`
    }

    const val = this.prepVal('markdown')

    if (this.type === 'terminal') {
      return `${'```'}\n$ ${val}\n${'```'}`
    }

    if (this.type === 'code') {
      return `${'```'}\n${val}\n${'```'}`
    }

    return mdFence(this.prepVal('markdown'))
  }

  private prepVal (target: 'ansi' | 'markdown'): string {
    if (this.val instanceof PartialErr) {
      return prepMessage(this.val.strArr, this.val.args, target, true)
    }

    if (isErrorLike(this.val)) {
      return `${this.val.name}: ${this.val.message}`
    }

    if (this.val && (this.config?.stringify || typeof this.val === 'object' || Array.isArray(this.val))) {
      return JSON.stringify(this.val, null, 2)
    }

    return `${this.val}`
  }
}

function mdFence (val: string) {
  // Don't double fence values
  if (val.includes('`')) {
    return val
  }

  if (isMultiLine(val)) {
    return `\`\`\`\n${val}\n\`\`\``
  }

  return `\`${val}\``
}

function isMultiLine (val: string) {
  return Boolean(val.split('\n').length > 1)
}

function makeFormat (type: keyof typeof fmtHighlight, config?: FormatConfig) {
  return (val: ToFormat, overrides?: FormatConfig) => {
    return new Format(type, val, {
      ...config,
      ...overrides,
    })
  }
}

const fmtHighlight = {
  meta: theme.gray,
  comment: theme.gray,
  path: theme.blue,
  code: theme.blue,
  url: theme.blue,
  flag: theme.magenta,
  stringify: theme.magenta,
  highlight: theme.yellow,
  highlightSecondary: theme.magenta,
  highlightTertiary: theme.blue,
  terminal: theme.blue,
} as const

export const fmt = {
  meta: makeFormat('meta'),
  comment: makeFormat('comment'),
  path: makeFormat('path'),
  code: makeFormat('code', { block: true }),
  url: makeFormat('url'),
  flag: makeFormat('flag'),
  stringify: makeFormat('stringify', { stringify: true }),
  highlight: makeFormat('highlight'),
  highlightSecondary: makeFormat('highlightSecondary'),
  highlightTertiary: makeFormat('highlightTertiary'),
  terminal: makeFormat('terminal'),
  off: guard,
  listItem,
  listItems,
  listFlags,
  stackTrace,
  cypressVersion,
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
    color: 'blue',
  })

  return stripIndent`${theme.gray(prefix)}${theme[color](item)}`
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

let originalError: Error | undefined = undefined
let details: string | undefined

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
  const msg = trimMultipleNewLines(prepMessage(strings, args, 'ansi'))

  return {
    message: msg,
    details,
    originalError,
    messageMarkdown: trimMultipleNewLines(stripAnsi(prepMessage(strings, args, 'markdown'))),
  }
}

/**
 * Takes an `errTemplate` / `errPartial` and converts it into a string, formatted conditionally
 * depending on the target environment
 *
 * @param templateStrings
 * @param args
 * @param target
 * @returns
 */
function prepMessage (templateStrings: TemplateStringsArray, args: AllowedTemplateArg[], target: 'ansi' | 'markdown', isPartial: boolean = false): string {
  // Reset the originalError to undefined on each new template string pass, we only need it to guard
  if (!isPartial) {
    originalError = undefined
    details = undefined
  }

  const templateArgs: string[] = []

  for (const arg of args) {
    // We assume null/undefined values are skipped when rendering, for conditional templating
    if (arg == null) {
      templateArgs.push('')
    } else if (arg instanceof Guard) {
      // Guard prevents any formatting
      templateArgs.push(`${arg.val}`)
    } else if (arg instanceof Format) {
      // Format = stringify & color ANSI, or make a markdown block
      templateArgs.push(arg.formatVal(target))
    } else if (arg instanceof StackTrace) {
      assert(!originalError, `Cannot use fmt.stackTrace() multiple times in the same errTemplate`)
      assert(!isPartial, `Cannot use fmt.stackTrace() in errPartial template string`)

      if (isErrorLike(arg.val)) {
        originalError = arg.val
        details = originalError.stack
      } else {
        if (process.env.CYPRESS_INTERNAL_ENV !== 'production') {
          throw new Error(`Cannot use arg.stackTrace with a non error-like value, saw ${JSON.stringify(arg.val)}`)
        }

        const err = new Error()

        err.stack = typeof arg.val === 'string' ? arg.val : JSON.stringify(arg.val)
        originalError = err
        details = err.stack
      }

      templateArgs.push('')
    } else if (arg instanceof PartialErr) {
      // Partial error = prepMessage + interpolate
      templateArgs.push(prepMessage(arg.strArr, arg.args, target, true))
    } else {
      throw new Error(`Invalid value passed to prepMessage, saw ${arg}`)
    }
  }

  return stripIndent(templateStrings, ...templateArgs)
}
