// @ts-check
const debug = require('debug')('@cypress/react')
const findWebpack = require('find-webpack')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const { addImageRedirect } = require('../utils/add-image-redirect')

const getWebpackPreprocessorOptions = (opts) => {
  debug('top level opts %o', opts)

  const webpackOptions = findWebpack.getWebpackOptions()

  if (!webpackOptions) {
    console.error('⚠️ Could not find Webpack options, using defaults')

    return webpackPreprocessor.defaultOptions
  }

  debug('webpack options: %o', webpackOptions)
  findWebpack.cleanForCypress(opts, webpackOptions)
  debug('cleaned webpack options: %o', webpackOptions)

  addImageRedirect(webpackOptions)

  const options = {
    webpackOptions,
    watchOptions: {},
  }

  return options
}

module.exports = (config) => {
  debug('env object %o', config.env)

  const coverageIsDisabled =
    config && config.env && config.env.coverage === false

  debug('coverage is disabled? %o', { coverageIsDisabled })
  debug('component test folder: %s', config.componentFolder)
  debug('fixtures folder', config.fixturesFolder)
  debug('integration test folder: %s', config.integrationFolder)

  const additionalFolders = []

  // user can disable folders, so check first
  if (config.componentFolder) {
    additionalFolders.push(config.componentFolder)
  }

  if (config.fixturesFolder) {
    additionalFolders.push(config.fixturesFolder)
  }

  if (config.integrationFolder) {
    additionalFolders.push(config.integrationFolder)
  }

  debug('additional folders: %o', additionalFolders)

  const opts = {
    reactScripts: true,
    addFolderToTranspile: additionalFolders,
    coverage: !coverageIsDisabled,
    // insert Babel plugin to mock named imports
    looseModules: true,
  }
  const preprocessorOptions = getWebpackPreprocessorOptions(opts)

  debug('final webpack options %o', preprocessorOptions.webpackOptions)

  return webpackPreprocessor(preprocessorOptions)
}
