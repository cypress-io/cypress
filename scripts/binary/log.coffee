chalk = require("chalk")

module.exports = (msg, color = "yellow") ->
  return if process.env["NODE_ENV"] is "test"

  console.log chalk[color](msg), chalk.bgWhite(chalk.black(@osName))
