// @ts-check
const debug = require('debug')('@cypress/react')
const tryLoadWebpackConfig = require('../utils/tryLoadWebpackConfig')
const { getTranspileFolders } = require('../utils/get-transpile-folders')
const { addFolderToBabelLoaderTranspileInPlace } = require('../utils/babel-helpers')

/**
 * Finds the ModuleScopePlugin plugin and adds given folder
 * to that list. This allows react-scripts to import folders
 * outside of the default "/src" folder.
 * WARNING modifies the input webpack options argument.
 * @see https://github.com/bahmutov/cypress-react-unit-test/issues/289
 * @param {string} folderName Folder to add, should be absolute
 */
function allowModuleSourceInPlace (folderName, webpackOptions) {
  if (!folderName) {
    return
  }

  if (!webpackOptions.resolve) {
    return
  }

  if (!Array.isArray(webpackOptions.resolve.plugins)) {
    return
  }

  const moduleSourcePlugin = webpackOptions.resolve.plugins.find((plugin) => {
    return Array.isArray(plugin.appSrcs)
  })

  if (!moduleSourcePlugin) {
    debug('cannot find module source plugin')

    return
  }

  debug('found module source plugin %o', moduleSourcePlugin)
  if (!moduleSourcePlugin.appSrcs.includes(folderName)) {
    moduleSourcePlugin.appSrcs.push(folderName)
    debug('added folder %s to allowed sources', folderName)
  }
}

const addCypressToWebpackEslintRulesInPlace = (webpackOptions) => {
  const globalsToAdd = ['cy', 'Cypress', 'before', 'after', 'context']

  if (webpackOptions.module && Array.isArray(webpackOptions.module.rules)) {
    const modulePre = webpackOptions.module.rules.find(
      (rule) => rule.enforce === 'pre',
    )

    if (modulePre && Array.isArray(modulePre.use)) {
      debug('found Pre block %o', modulePre)

      const useEslintLoader = modulePre.use.find(
        (use) => use.loader && use.loader.includes('eslint-loader'),
      )

      if (useEslintLoader) {
        debug('found useEslintLoader %o', useEslintLoader)

        if (useEslintLoader.options) {
          if (Array.isArray(useEslintLoader.options.globals)) {
            debug(
              'adding cy to existing globals %o',
              useEslintLoader.options.globals,
            )

            useEslintLoader.options.globals.push(...globalsToAdd)
          } else {
            debug('setting new list of globals with cy and Cypress')
            useEslintLoader.options.globals = globalsToAdd
          }

          debug('updated globals %o', useEslintLoader.options.globals)
        } else {
          debug('eslint loader does not have options ⚠️')
        }
      }
    }
  }
}

module.exports = function findReactScriptsWebpackConfig (config) {
  // this is required because
  // 1) we use our own HMR and we don't need react-refresh transpiling overhead
  // 2) it doesn't work with process.env=test @see https://github.com/cypress-io/cypress-realworld-app/pull/832
  process.env.FAST_REFRESH = 'false'
  const webpackConfig = tryLoadWebpackConfig('react-scripts/config/webpack.config')

  if (!webpackConfig) {
    throw new Error('⚠️ Could not find Webpack options for react-scripts. Make sure that you have react-scripts module available.')
  }

  // because for react-scripts user doesn't have direct access to webpack webpackConfig
  // we must implicitly inject everything required to run tests
  addCypressToWebpackEslintRulesInPlace(webpackConfig)

  getTranspileFolders(config).forEach((cypressFolder) => {
    allowModuleSourceInPlace(cypressFolder, webpackConfig)
    addFolderToBabelLoaderTranspileInPlace(cypressFolder, webpackConfig)
  })

  debug('resolved webpack config: %o', webpackConfig)

  return webpackConfig
}
