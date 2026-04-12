import chalk from 'chalk'
import { defaults, mapValues } from '@packages/utils'
import Table from 'cli-table3'
import utils from 'cli-table3/src/utils'
import widestLine from 'widest-line'
// Use require so that sinon stubs in tests can intercept calls

const terminalSize = require('./terminal-size') as typeof import('./terminal-size')
import type { HorizontalAlignment } from 'cli-table3'

const MAXIMUM_SIZE = 100
const EXPECTED_SUM = 100

export const getMaximumColumns = () => {
  // get the maximum amount of columns
  // that can fit in the terminal
  return Math.min(MAXIMUM_SIZE, terminalSize.get().columns)
}

const getBordersLength = (left, right) => {
  return [left, right]
  .filter(Boolean)
  .map(widestLine)
  .reduce((sum, n) => sum + n, 0)
}

export const renderTables = (...tables) => {
  // Note: do not use .flat() or concat here because cli-table3's Table extends Array,
  // and Array methods would unwrap Table instances into their row arrays.
  const allTables: any[] = []

  for (const t of tables) {
    if (Array.isArray(t) && !(t instanceof Table)) {
      allTables.push(...t)
    } else {
      allTables.push(t)
    }
  }

  return allTables
  .map((t) => t.toString())
  .join('\n')
}

const getChars = (type) => {
  switch (type) {
    case 'border':
      return {
        'top-mid': '',
        'top-left': '  ┌',
        'left': '  │',
        'left-mid': '  ├',
        'middle': '',
        'mid-mid': '',
        'right': '│',
        'bottom-mid': '',
        'bottom-left': '  └',
      }
    case 'noBorder':
      return {
        'top': '',
        'top-mid': '',
        'top-left': '',
        'top-right': '',
        'left': '   ',
        'left-mid': '',
        'middle': '',
        'mid': '',
        'mid-mid': '',
        'right': ' ',
        'right-mid': '',
        'bottom': '',
        'bottom-left': '',
        'bottom-mid': '',
        'bottom-right': '',
      }
    case 'outsideBorder':
      return {
        // "top": ""
        'top-left': '  ┌',
        'top-mid': '',
        'left': '  │',
        'left-mid': '',
        'middle': '',
        'mid': '',
        'mid-mid': '',
        'right-mid': '',
        'bottom-mid': '',
        'bottom-left': '  └',
      }
    case 'pageDivider':
      return {
        'top': '─',
        'top-mid': '',
        'top-left': '',
        'top-right': '',
        'bottom': '',
        'bottom-mid': '',
        'bottom-left': '',
        'bottom-right': '',
        'left': '',
        'left-mid': '',
        'mid': '',
        'mid-mid': '',
        'right': '',
        'right-mid': '',
        'middle': '',
      }
    case 'allBorders':
      return {
        // this is default from cli-table mostly just for debugging,
        // if you want to see where borders would be drawn
        'top': '─',
        'top-mid': '┬',
        'top-left': '┌',
        'top-right': '┐',
        'bottom': '─',
        'bottom-mid': '┴',
        'bottom-left': '└',
        'bottom-right': '┘',
        'left': '│',
        'left-mid': '├',
        'mid': '─',
        'mid-mid': '┼',
        'right': '│',
        'right-mid': '┤',
        'middle': '│',
      }
    default: throw new Error(`Table chars type: "${type}" is not supported`)
  }
}

const wrapBordersInGray = (chars) => {
  return mapValues(chars, (char) => {
    if (char) {
      return chalk.gray(char)
    }

    return char
  })
}

export const table = (options: { type: string, colWidths?: number[], colAligns?: HorizontalAlignment[], head?: string[], chars?: Record<string, string>, style?: { [key: string]: any } }) => {
  const { type } = options
  const tableDefaults = utils.mergeOptions({})

  let { colWidths } = options
  let chars = defaults(getChars(type), tableDefaults.chars)

  if (!options.chars) {
    options.chars = chars
  } else {
    options.chars = defaults(options.chars, chars)
  }

  if (!options.style) {
    options.style = {}
  }

  options.style = defaults(options.style, {
    head: [],
    border: [],
    'padding-left': 1,
    'padding-right': 1,
  })

  chars = options.chars

  if (colWidths) {
    const sum = colWidths.reduce((a, b) => a + b, 0)

    if (sum !== EXPECTED_SUM) {
      throw new Error(`Expected colWidths array to sum to: ${EXPECTED_SUM}, instead got: ${sum}`)
    }

    const bordersLength = getBordersLength(chars.left, chars.right)

    if (bordersLength > 0) {
      // redistribute the columns to account for borders on each side...
      // and subtract  borders size from the largest width cell
      const largestCellWidth = Math.max(...colWidths)

      const index = colWidths.indexOf(largestCellWidth)

      colWidths = [...colWidths]

      colWidths[index] = largestCellWidth - bordersLength
      options.colWidths = colWidths
    }
  }

  options.chars = wrapBordersInGray(chars)

  return new Table(options)
}

export const header = (message: string, options: { color?: string[] | null } = {}) => {
  if (options.color === undefined) {
    options.color = null
  }

  message = `  (${chalk.underline.bold(message)})`

  if (options.color) {
    // @ts-expect-error type is cast incorrectly to never
    const colors = <string[]>[].concat(options.color)

    message = colors.reduce((memo, color) => {
      return chalk[color](memo)
    }, message)
  }

  console.log(message) // eslint-disable-line no-console
}

export const divider = (symbol, color = 'gray') => {
  const cols = getMaximumColumns()
  const str = symbol.repeat(cols)

  console.log(chalk[color](str)) // eslint-disable-line no-console
}
