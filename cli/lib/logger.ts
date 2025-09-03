import chalk from 'chalk'

let logs: string[] = []

const logLevel = (): string => {
  return (process.env.npm_config_loglevel || 'notice')
}

const error = (...messages: any[]): void => {
  logs.push(messages.join(' '))
  console.log(chalk.red(...messages)) // eslint-disable-line no-console
}

const warn = (...messages: any[]): void => {
  if (logLevel() === 'silent') return

  logs.push(messages.join(' '))
  console.log(chalk.yellow(...messages)) // eslint-disable-line no-console
}

const log = (...messages: any[]): void => {
  if (logLevel() === 'silent' || logLevel() === 'warn') return

  logs.push(messages.join(' '))
  console.log(...messages) // eslint-disable-line no-console
}

const always = (...messages: any[]): void => {
  logs.push(messages.join(' '))
  console.log(...messages) // eslint-disable-line no-console
}

// splits long text into lines and calls log()
// on each one to allow easy unit testing for specific message
const logLines = (text: string): void => {
  const lines = text.split('\n')

  for (const line of lines) {
    log(line)
  }
}

const print = (): string => {
  return logs.join('\n')
}

const reset = (): void => {
  logs = []
}

const loggerModule = {
  log,
  warn,
  error,
  always,
  logLines,
  print,
  reset,
  logLevel,
}

export default loggerModule
