/* eslint-disable no-console */
import chalk from 'chalk'

let logs: string[] = []

export const logLevel = () => process.env.npm_config_loglevel || 'notice'

export const error = (...messages: string[]) => {
  logs.push(messages.join(' '))
  console.log(chalk.red(...messages))
}

export const warn = (...messages: string[]) => {
  if (logLevel() === 'silent') {
    return
  }

  logs.push(messages.join(' '))
  console.log(chalk.yellow(...messages))
}

export const log = (...messages: string[]) => {
  if (logLevel() === 'silent' || logLevel() === 'warn') {
    return
  }

  logs.push(messages.join(' '))
  console.log(...messages)
}

export const always = (...messages: string[]) => {
  logs.push(messages.join(' '))
  console.log(...messages)
}

// splits long text into lines and calls log()
// on each one to allow easy unit testing for specific message
export const logLines = (text: string) => {
  const lines = text.split('\n')

  lines.forEach((l) => log(l))
}

export const print = () => logs.join('\n')

export const reset = () => {
  logs = []
}
