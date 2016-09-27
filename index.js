var path    = require("path")
var pkgsDir = path.join(__dirname, "packages")

require("app-module-path").addPath(pkgsDir)

require("coffee-script/register")

module.exports = require("./lib").start(process.argv.slice(2))