_     = require("lodash")
chalk = require("chalk")
Table = require("cli-table2")
utils = require("cli-table2/src/utils")
widestLine = require("widest-line")
terminalSize = require("./terminal-size")

MAXIMUM_SIZE = 100
EXPECTED_SUM = 100

getMaximumColumns = ->
  ## get the maximum amount of columns
  ## that can fit in the terminal
  Math.min(MAXIMUM_SIZE, terminalSize.get().columns)

getBordersLength = (left, right) ->
  _
  .chain([left, right])
  .compact()
  .map(widestLine)
  .sum()
  .value()

convertDecimalsToNumber = (colWidths, cols) ->
  sum = _.sum(colWidths)

  if sum isnt EXPECTED_SUM
    throw new Error("Expected colWidths array to sum to: #{EXPECTED_SUM}, instead got: #{sum}")

  [50, 10, 25]

  widths = _.map colWidths, (width) ->
    ## easier to deal with numbers than floats...
    num = (cols * width) / EXPECTED_SUM

    Math.floor(num)

  total = _.sum(widths)

  ## if we got a sum less than the total
  ## columns, then add the difference to
  ## the first element in the array of widths
  if (diff = cols - total) > 0
    first = widths[0]
    widths[0] += diff

  widths

renderTables = (tables...) ->
  _
  .chain([])
  .concat(tables)
  .invokeMap("toString")
  .join("\n")
  .value()

getChars = (type) ->
  switch type
    when "border"
      return {
        "top-mid": ""
        "top-left": "  ┌"
        "left": "  │"
        "left-mid": "  ├"
        "middle": ""
        "mid-mid": ""
        "bottom-mid": ""
        "bottom-left": "  └"
      }
    when "noBorder"
      return {
        "top": ""
        "top-mid": ""
        "top-left": ""
        "top-right": ""
        "left": "   "
        "left-mid": ""
        "middle": ""
        "mid": ""
        "mid-mid": ""
        "right": ""
        "right-mid": ""
        "bottom": ""
        "bottom-left": ""
        "bottom-mid": ""
        "bottom-right": ""
      }
    when "outsideBorder"
      return {
        # "top": ""
        "top-left": "  ┌"
        "top-mid": ""
        "left": "  │"
        "left-mid": ""
        "middle": ""
        "mid": ""
        "mid-mid": ""
        "right-mid": ""
        "bottom-mid": ""
        "bottom-left": "  └"
      }
    when "pageDivider"
      return {
        "top": "─"
        "top-mid": ""
        "top-left": ""
        "top-right": ""
        "bottom": ""
        "bottom-mid": ""
        "bottom-left": ""
        "bottom-right": ""
        "left": ""
        "left-mid": ""
        "mid": ""
        "mid-mid": ""
        "right": ""
        "right-mid": ""
        "middle": ""
      }

wrapBordersInGray = (chars) ->
  _.mapValues chars, (char) ->
    if char
      chalk.gray(char)
    else
      char

table = (options = {}) ->
  { colWidths, type } = options

  defaults = utils.mergeOptions({})

  chars = _.defaults(getChars(type), defaults.chars)

  _.defaultsDeep(options, {
    chars
    style: {
      head: []
      border: []
      'padding-left': 1
      'padding-right': 1
    }
  })

  { chars } = options

  borders = getBordersLength(chars.left, chars.right)

  options.chars = wrapBordersInGray(chars)

  if colWidths
    ## subtract borders to get the actual size
    ## so it displaces a maximum number of columns
    cols = getMaximumColumns() - borders
    options.colWidths = convertDecimalsToNumber(colWidths, cols)

  new Table(options)

header = (message, options = {}) ->
  _.defaults(options, {
    color: null
  })

  message = "  (" + chalk.underline.bold(message) + ")"

  if c = options.color
    colors = [].concat(c)

    message = _.reduce colors, (memo, color) ->
      chalk[color](memo)
    , message

  console.log(message)

divider = (symbol, color = "gray") ->
  cols = getMaximumColumns()

  str = symbol.repeat(cols)

  console.log(chalk[color](str))

module.exports = {
  table

  header

  divider

  renderTables

  getMaximumColumns

  convertDecimalsToNumber

}
