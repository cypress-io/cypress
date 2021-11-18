// @ts-check
const debug = require('debug')('@cypress/react')
const tryLoadWebpackConfig = require('../utils/tryLoadWebpackConfig')
const { allowModuleSourceInPlace } = require('../utils/webpack-helpers')
const { addCypressToWebpackEslintRulesInPlace } = require('../utils/eslint-helpers')
const { getTranspileFolders } = require('../utils/get-transpile-folders')
const { addFolderToBabelLoaderTranspileInPlace } = require('../utils/babel-helpers')

module.exports = function findReactScriptsWebpackConfig (config, {
  webpackConfigPath,
} = { webpackConfigPath: 'react-scripts/config/webpack.config' }) {
  // this is required because
  // 1) we use our own HMR and we don't need react-refresh transpiling overhead
  // 2) it doesn't work with process.env=test @see https://github.com/cypress-io/cypress-realworld-app/pull/832
  process.env.FAST_REFRESH = 'false'
  const webpackConfig = tryLoadWebpackConfig(webpackConfigPath)

  if (!webpackConfig) {
    throw new Error('⚠️ Could not find Webpack options for react-scripts. Make sure that you have react-scripts module available.')
  }

  // because for react-scripts user doesn't have direct access to webpack webpackConfig
  // we must implicitly setup everything required to run tests
  addCypressToWebpackEslintRulesInPlace(webpackConfig)

  getTranspileFolders(config).forEach((cypressFolder) => {
    allowModuleSourceInPlace(cypressFolder, webpackConfig)
    addFolderToBabelLoaderTranspileInPlace(cypressFolder, webpackConfig)
  })

  debug('resolved webpack config: %o', webpackConfig)

  return webpackConfig
}
