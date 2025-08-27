const chalk = require('chalk')

let logs = []

const logLevel = () => {
  return (process.env.npm_config_loglevel || 'notice')
}

// Simple serialization helper to prevent [object Object] issues
const serializeMessage = (msg) => {
  if (typeof msg === 'object' && msg !== null) {
    try {
      return JSON.stringify(msg)
    } catch {
      return String(msg)
    }
  }

  return String(msg)
}

const error = (...messages) => {
  logs.push(messages.join(' '))
  console.log(chalk.red(...messages.map(serializeMessage))) // eslint-disable-line no-console
}

const warn = (...messages) => {
  if (logLevel() === 'silent') return

  logs.push(messages.join(' '))
  console.log(chalk.yellow(...messages.map(serializeMessage))) // eslint-disable-line no-console
}

const log = (...messages) => {
  if (logLevel() === 'silent' || logLevel() === 'warn') return

  logs.push(messages.join(' '))
  console.log(...messages.map(serializeMessage)) // eslint-disable-line no-console
}

const always = (...messages) => {
  logs.push(messages.join(' '))
  console.log(...messages.map(serializeMessage)) // eslint-disable-line no-console
}

// splits long text into lines and calls log()
// on each one to allow easy unit testing for specific message
const logLines = (text) => {
  const lines = text.split('\n')

  for (const line of lines) {
    log(line)
  }
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
  always,
  logLines,
  print,
  reset,
  logLevel,
}
