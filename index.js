require("app-module-path/register")
require("coffee-script/register")

module.exports = require("./lib").start(process.argv.slice(2))
