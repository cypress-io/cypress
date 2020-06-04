// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chalk = require('chalk')

module.exports = function (msg, color = 'yellow') {
  if (process.env['NODE_ENV'] === 'test') {
    return
  }

  return console.log(chalk[color](msg), chalk.bgWhite(chalk.black(this.osName)))
}
