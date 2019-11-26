path           = require("path")
coffeeCoverage = require("coffee-coverage")

return if not process.env["NODE_COVERAGE"]

projectRoot = path.resolve(__dirname, "../../..")
coverageVar = coffeeCoverage.findIstanbulVariable()

## Only write a coverage report if we"re not running inside of Istanbul.
writeOnExit = if coverageVar then null else projectRoot + "/coverage/coverage-coffee.json"

coffeeCoverage.register({
  instrumentor: "istanbul"
  basePath: projectRoot
  exclude: ["/gulpfile.coffee", "/deploy", "/build", "/dist", "/tmp", "/test", "/spec", "/app", "/bower_components", "/cache", "/support", "/node_modules", "/.git", "/.cy", "/.projects"],
  coverageVar: coverageVar
  writeOnExit: writeOnExit
  initAll: true
})

## using hack found here to prevent problems with
## coffee-coverage being replaced by modules which
## use coffeescript/register
## https://github.com/abresas/register-coffee-coverage/blob/master/index.js
loader = require.extensions[".coffee"]

Object.defineProperty require.extensions, ".coffee", {
  get: -> loader
  set: -> loader
}
