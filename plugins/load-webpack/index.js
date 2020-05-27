// @ts-check
const path = require('path')
const debug = require('debug')('cypress-react-unit-test')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const findWebpack = require('find-webpack')
const { addImageRedirect } = require('../utils/add-image-redirect')

module.exports = (on, config) => {
  require('@cypress/code-coverage/task')(on, config)

  const webpackFilename = config.env && config.env.webpackFilename
  if (!webpackFilename) {
    throw new Error(
      'Could not find "webpackFilename" option in Cypress env variables',
    )
  }
  debug('got webpack config filename %s', webpackFilename)
  const resolved = path.resolve(webpackFilename)
  debug('resolved webpack at %s', webpackFilename)

  let webpackOptions = require(resolved)
  debug('loaded webpack options: %o', webpackOptions)
  if (webpackOptions.default) {
    // we probably loaded TS file
    debug('loaded webpack options has .default - taking that as the config')
    webpackOptions = webpackOptions.default
  }

  debug('webpack options: %o', webpackOptions)

  const coverageIsDisabled =
    config && config.env && config.env.coverage === false
  debug('coverage is disabled? %o', { coverageIsDisabled })

  const opts = {
    reactScripts: true,
    coverage: !coverageIsDisabled,
  }

  findWebpack.cleanForCypress(opts, webpackOptions)
  debug('cleaned webpack options: %o', webpackOptions)

  addImageRedirect(webpackOptions)

  const options = {
    webpackOptions,
    watchOptions: {},
  }

  on('file:preprocessor', webpackPreprocessor(options))

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
