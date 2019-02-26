/* eslint-disable
    brace-style,
    default-case,
    no-cond-assign,
    no-console,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const chalk = require('chalk')
const Table = require('cli-table2')
const utils = require('cli-table2/src/utils')
const widestLine = require('widest-line')
const terminalSize = require('./terminal-size')

const MAXIMUM_SIZE = 100
const EXPECTED_SUM = 100

const getMaximumColumns = () =>
//# get the maximum amount of columns
//# that can fit in the terminal
{
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
  let diff
  const sum = _.sum(colWidths)

  if (sum !== EXPECTED_SUM) {
    throw new Error(`Expected colWidths array to sum to: ${EXPECTED_SUM}, instead got: ${sum}`)
  }

  [50, 10, 25]

  const widths = _.map(colWidths, (width) => {
    //# easier to deal with numbers than floats...
    const num = (cols * width) / EXPECTED_SUM

    return Math.floor(num)
  })

  const total = _.sum(widths)

  //# if we got a sum less than the total
  //# columns, then add the difference to
  //# the first element in the array of widths
  if ((diff = cols - total) > 0) {
    const first = widths[0]

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
  const { colWidths, type } = options

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

  const borders = getBordersLength(chars.left, chars.right)

  options.chars = wrapBordersInGray(chars)

  if (colWidths) {
    //# subtract borders to get the actual size
    //# so it displaces a maximum number of columns
    const cols = getMaximumColumns() - borders

    options.colWidths = convertDecimalsToNumber(colWidths, cols)
  }

  return new Table(options)
}

const header = function (message, options = {}) {
  let c

  _.defaults(options, {
    color: null,
  })

  message = `  (${chalk.underline.bold(message)})`

  if (c = options.color) {
    const colors = [].concat(c)

    message = _.reduce(colors, (memo, color) => {
      return chalk[color](memo)
    }
      , message)
  }

  return console.log(message)
}

const divider = function (symbol, color = 'gray') {
  const cols = getMaximumColumns()

  const str = symbol.repeat(cols)

  return console.log(chalk[color](str))
}

module.exports = {
  table,

  header,

  divider,

  renderTables,

  getMaximumColumns,

  convertDecimalsToNumber,

}
