require("./environment")

konfig = require("konfig")

getConfig = ->
  { env } = process

  ## backup previous env
  previousNodeEnv = env.NODE_ENV
  previousNodeEnvExisted = env.hasOwnProperty("NODE_ENV")

  ## we want to set node env to cypress env
  ## and then restore it back to the previous
  env.NODE_ENV = env.CYPRESS_KONFIG_ENV or env.CYPRESS_ENV

  ## get the config values
  config = konfig().app

  ## restore NODE_ENV to previous state
  if previousNodeEnvExisted
    env.NODE_ENV = previousNodeEnv
  else
    delete env.NODE_ENV

  ## return the config getter function
  return (getter) ->
    config[getter]

module.exports = getConfig()
