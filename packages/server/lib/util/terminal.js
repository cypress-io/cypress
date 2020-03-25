const _ = require('lodash')
const chalk = require('chalk')
const Table = require('cli-table3')
const utils = require('cli-table3/src/utils')
const widestLine = require('widest-line')
const terminalSize = require('./terminal-size')

const MAXIMUM_SIZE = 100
const EXPECTED_SUM = 100

const getMaximumColumns = () => {
  // get the maximum amount of columns
  // that can fit in the terminal
  return Math.min(MAXIMUM_SIZE, terminalSize.get().columns)
}

const getBordersLength = (left, right) => {
  return _
  .chain([left, right])
  .compact()
  .map(widestLine)
  .sum()
  .value()
}

const renderTables = (...tables) => {
  return _
  .chain([])
  .concat(tables)
  .invokeMap('toString')
  .join('\n')
  .value()
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
  return _.mapValues(chars, (char) => {
    if (char) {
      return chalk.gray(char)
    }

    return char
  })
}

const table = (options = {}) => {
  const { type } = options
  const defaults = utils.mergeOptions({})

  let { colWidths } = options
  let chars = _.defaults(getChars(type), defaults.chars)

  _.defaultsDeep(options, {
    chars,
    style: {
      head: [],
      border: [],
      'padding-left': 1,
      'padding-right': 1,
    },
  })

  chars = options.chars

  if (colWidths) {
    const sum = _.sum(colWidths)

    if (sum !== EXPECTED_SUM) {
      throw new Error(`Expected colWidths array to sum to: ${EXPECTED_SUM}, instead got: ${sum}`)
    }

    const bordersLength = getBordersLength(chars.left, chars.right)

    if (bordersLength > 0) {
      // redistribute the columns to account for borders on each side...
      // and subtract  borders size from the largest width cell
      const largestCellWidth = _.max(colWidths)

      const index = _.indexOf(colWidths, largestCellWidth)

      colWidths = _.clone(colWidths)

      colWidths[index] = largestCellWidth - bordersLength
      options.colWidths = colWidths
    }
  }

  options.chars = wrapBordersInGray(chars)

  return new Table(options)
}

const header = (message, options = {}) => {
  _.defaults(options, {
    color: null,
  })

  message = `  (${chalk.underline.bold(message)})`

  if (options.color) {
    const colors = [].concat(options.color)

    message = _.reduce(colors, (memo, color) => {
      return chalk[color](memo)
    }, message)
  }

  console.log(message) // eslint-disable-line no-console
}

const divider = (symbol, color = 'gray') => {
  const cols = getMaximumColumns()
  const str = symbol.repeat(cols)

  console.log(chalk[color](str)) // eslint-disable-line no-console
}

module.exports = {
  table,

  header,

  divider,

  renderTables,

  getMaximumColumns,
}
