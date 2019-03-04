chalk = require("chalk")

module.exports = (msg, color = "yellow") ->
  return if process.env["NODE_ENV"] is "test"
  if typeof color is 'function'
    console.log color(memo), chalk.bgWhite(chalk.black(@osName))
  else
    console.log chalk[color](msg), chalk.bgWhite(chalk.black(@osName))
