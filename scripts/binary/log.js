const chalk = require('chalk')

module.exports = function (msg, color = 'yellow') {
  if (process.env['NODE_ENV'] === 'test') {
    return
  }

  return console.log(chalk[color](msg), chalk.bgWhite(chalk.black(this.osName)))
}
