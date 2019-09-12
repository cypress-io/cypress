/* eslint-disable no-console */
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

const convertDecimalsToNumber = function (colWidths, cols) {
  const sum = _.sum(colWidths)

  if (sum !== EXPECTED_SUM) {
    throw new Error(`Expected colWidths array to sum to: ${EXPECTED_SUM}, instead got: ${sum}`)
  }

  const widths = _.map(colWidths, (width) => {
    // easier to deal with numbers than floats...
    const num = (cols * width) / EXPECTED_SUM

    return Math.floor(num)
  })

  const total = _.sum(widths)
  const diff = cols - total

  // if we got a sum less than the total
  // columns, then add the difference to
  // the first element in the array of widths
  if (diff > 0) {
    widths[0] += diff
  }

  return widths
}

const renderTables = (...tables) => {
  return _
  .chain([])
  .concat(tables)
  .invokeMap('toString')
  .join('\n')
  .value()
}

const getChars = function (type) {
  switch (type) {
    case 'border':
      return {
        'top-mid': '',
        'top-left': '  ┌',
        'left': '  │',
        'left-mid': '  ├',
        'middle': '',
        'mid-mid': '',
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
        'right': '',
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

const table = function (options = {}) {
  let { colWidths, type } = options
  const defaults = utils.mergeOptions({})

  let chars = _.defaults(getChars(type), defaults.chars)

  _.defaultsDeep(options, {
    chars,
    style: {
      head: [],
      border: [],
      'padding-left': 1,
      'padding-right': 1,
    },
  });

  ({ chars } = options)

  options.chars = wrapBordersInGray(chars)

  if (colWidths) {
    const bordersLength = getBordersLength(chars.left, chars.right)

    if (bordersLength > 0) {
      // subtract borders to get the actual size
      // so it displaces a maximum number of columns
      // const cols = getMaximumColumns() - bordersLength

      // redistribute the columns to account for borders on each side...
      // and subtract from the largest width cell
      const largestCellWidth = _.max(colWidths)
      const index = _.indexOf(colWidths, largestCellWidth)

      colWidths = _.clone(colWidths)

      colWidths[index] = largestCellWidth - bordersLength

      // const lastIndex = colWidths.length - 1

      // colWidths[0] = colWidths[0] + chars.left.length
      // colWidths[lastIndex] = colWidths[lastIndex] + chars.right.length

      options.colWidths = colWidths

      // options.colWidths = convertDecimalsToNumber(colWidths, cols)
    }

  }

  return new Table(options)
}

const header = function (message, options = {}) {
  _.defaults(options, {
    color: null,
  })

  message = `  (${chalk.underline.bold(message)})`

  if (options.color) {
    const colors = [].concat(options.color)

    message = _.reduce(colors, (memo, color) => {
      return chalk[color](memo)
    }
    , message)
  }

  console.log(message)
}

const divider = function (symbol, color = 'gray') {
  const cols = getMaximumColumns()
  const str = symbol.repeat(cols)

  console.log(chalk[color](str))
}

module.exports = {
  table,

  header,

  divider,

  renderTables,

  getMaximumColumns,

  convertDecimalsToNumber,
}
