const chalk = require('chalk')
const debug = require('debug')('cypress:cli')
const ProgressBar = require('progress')
const logger = require('../logger')

const makeMockBar = (title, barOptions = { total: 100 }) => {
  if (!title) {
    throw new Error('Missing progress bar title')
  }
  logger.log(chalk.blue(`${title}, please wait`))
  return {
    mock: true,
    curr: 0,
    tick () {
      this.curr += 1
      if (this.curr >= barOptions.total) {
        this.complete = true
        logger.log(chalk.green(`${title} finished`))
      }
    },
    terminate () {
      logger.log(`${title} failed`)
    },
  }
}

const getProgressBar = (title, barOptions) => {
  const isCI = require('is-ci')
  const ascii = [
    chalk.white('  -'),
    chalk.blue(title),
    chalk.yellow('[:bar]'),
    chalk.white(':percent'),
    chalk.gray(':etas'),
  ]
  debug('progress bar with options %j isCI?', barOptions, isCI)
  return isCI ? makeMockBar(title, barOptions) : new ProgressBar(ascii.join(' '), barOptions)
}

module.exports = {
  getProgressBar,
}
