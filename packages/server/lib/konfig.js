require('./environment')

const konfig = require('konfig')

const getConfig = function () {
  const { env } = process

  // backup previous env
  const previousNodeEnv = env.NODE_ENV
  const previousNodeEnvExisted = env.hasOwnProperty('NODE_ENV')

  // we want to set node env to cypress env
  // and then restore it back to the previous
  env.NODE_ENV = env.CYPRESS_KONFIG_ENV || env.CYPRESS_INTERNAL_ENV

  // get the config values
  const config = konfig().app

  // restore NODE_ENV to previous state
  if (previousNodeEnvExisted) {
    env.NODE_ENV = previousNodeEnv
  } else {
    delete env.NODE_ENV
  }

  // return the config getter function
  return (getter) => {
    return config[getter]
  }
}

module.exports = getConfig()
