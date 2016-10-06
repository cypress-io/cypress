require("./environment")

konfig = require("konfig")

getConfig = ->
  ## backup previous env
  previousNodeEnv = process.env["NODE_ENV"]

  ## we want to set node env to cypress env
  ## and then restore it back to the previous
  process.env["NODE_ENV"] = process.env["CYPRESS_ENV"]

  ## get the config values
  config = konfig().app

  ## restore
  process.env["NODE_ENV"] = previousNodeEnv

  ## return the config getter function
  return (getter) ->
    config[getter]

module.exports = getConfig()