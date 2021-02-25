// @ts-check
const path = require('path')
const debug = require('debug')('@cypress/react')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const findWebpack = require('find-webpack')
const { getTranspileFolders } = require('../utils/get-transpile-folders')
const { addImageRedirect } = require('../utils/add-image-redirect')

module.exports = (on, config) => {
  const webpackFilename = config.env && config.env.webpackFilename

  if (!webpackFilename) {
    throw new Error(
      'Could not find "webpackFilename" option in Cypress env variables',
    )
  }

  debug('got webpack config filename %s', webpackFilename)
  const resolved = path.resolve(webpackFilename)

  debug('resolved webpack at %s', resolved)

  const webpackOptions = findWebpack.tryLoadingWebpackConfig(resolved)

  if (!webpackOptions) {
    throw new Error(`Could not load webpack config from ${resolved}`)
  }

  debug('webpack options: %o', webpackOptions)

  const coverageIsDisabled =
    config && config.env && config.env.coverage === false

  debug('coverage is disabled? %o', { coverageIsDisabled })

  const opts = {
    reactScripts: true,
    addFolderToTranspile: getTranspileFolders(config),
    coverage: !coverageIsDisabled,
    // insert Babel plugin to mock named imports
    looseModules: true,
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
