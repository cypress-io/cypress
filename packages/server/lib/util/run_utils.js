const chalk = require('chalk')
const newlines = require('./newlines')
const env = require('./env')

const color = (val, c) => {
  return chalk[c](val)
}

const gray = (val) => {
  return color(val, 'gray')
}

const formatPath = (name, n, colour = 'reset') => {
  if (!name) return ''

  const fakeCwdPath = env.get('FAKE_CWD_PATH')

  if (fakeCwdPath && env.get('CYPRESS_INTERNAL_ENV') === 'test') {
    // if we're testing within Cypress, we want to strip out
    // the current working directory before calculating the stdout tables
    // this will keep our snapshots consistent everytime we run
    const cwdPath = process.cwd()

    name = name
    .split(cwdPath)
    .join(fakeCwdPath)
  }

  // add newLines at each n char and colorize the path
  if (n) {
    let nameWithNewLines = newlines.addNewlineAtEveryNChar(name, n)

    return `${color(nameWithNewLines, colour)}`
  }

  return `${color(name, colour)}`
}

const getWidth = (table, index) => {
  // get the true width of a table's column,
  // based off of calculated table options for that column
  const columnWidth = table.options.colWidths[index]

  if (columnWidth) {
    return columnWidth - (table.options.style['padding-left'] + table.options.style['padding-right'])
  }

  return 0
}

module.exports = {
  color,
  gray,
  formatPath,
  getWidth,
}
