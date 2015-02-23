fs = require("fs-extra")

pkg = process.cwd() + "/package.json"

getEnv = ->
  ## use the node_env if its set
  ## or grab it from our package.json env
  ## or finally default it to development
  process.env["NODE_ENV"] ?= fs.readJsonSync(pkg).env ? "development"

module.exports = getEnv()
