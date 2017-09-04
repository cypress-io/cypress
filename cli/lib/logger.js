const R = require('ramda')
const chalk = require('chalk')

let logs = []

const error = (...messages) => {
  logs.push(messages.join(' '))
  console.log(chalk.red(...messages)) // eslint-disable-line no-console
}

const warn = (...messages) => {
  logs.push(messages.join(' '))
  console.log(chalk.yellow(...messages)) // eslint-disable-line no-console
}

const log = (...messages) => {
  logs.push(messages.join(' '))
  console.log(...messages) // eslint-disable-line no-console
}

// splits long text into lines and calls log()
// on each one to allow easy unit testing for specific message
const logLines = (text) => {
  const lines = text.split('\n')
  R.forEach(log, lines)
}

const print = () => {
  return logs.join('\n')
}

const reset = () => {
  logs = []
}

module.exports = {
  log,
  warn,
  error,
  logLines,
  print,
  reset,
}
