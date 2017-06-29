const chalk = require('chalk')
const beeper = require('beeper')

module.exports = function beepAndLog (err) {
  beeper(1)

  /* eslint-disable no-console */
  console.error(chalk.red(err.stack))
}
