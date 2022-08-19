import debugLib from 'debug'
import type { Configuration, ResolvePluginInstance, RuleSetRule } from 'webpack'
import path from 'path'
import type { PresetHandlerResult, WebpackDevServerConfig } from '../devServer'
import { sourceDefaultWebpackDependencies } from './sourceRelativeWebpackModules'

const debug = debugLib('cypress:webpack-dev-server:create-react-app')

/**
 * Sourcing the config for create-react-app
 */
export function createReactAppHandler (devServerConfig: WebpackDevServerConfig): PresetHandlerResult {
  const sourceWebpackModulesResult = sourceDefaultWebpackDependencies(devServerConfig)

  // this is required because
  // 1) we use our own HMR and we don't need react-refresh transpiling overhead
  // 2) it doesn't work with process.env=test @see https://github.com/cypress-io/cypress-realworld-app/pull/832
  process.env.FAST_REFRESH = 'false'
  const webpackConfig = loadWebpackConfig(devServerConfig)

  addCypressToWebpackEslintRulesInPlace(webpackConfig)

  getTranspileFolders(devServerConfig.cypressConfig).forEach((folder) => {
    allowModuleSourceInPlace(folder, webpackConfig)
    addFolderToBabelLoaderTranspileInPlace(folder, webpackConfig)
  })

  if (sourceWebpackModulesResult.webpack.majorVersion === 5) {
    debug('Modifying configuration for react-scripts@5')

    reactScriptsFiveModifications(webpackConfig)
  }

  return {
    frameworkConfig: webpackConfig,
    sourceWebpackModulesResult,
  }
}

function loadWebpackConfig (devServerConfig: WebpackDevServerConfig): Configuration {
  let webpackConfigPath: string

  const envName = 'test'

  process.env.NODE_ENV = envName
  process.env.BABEL_ENV = envName

  try {
    // Search for react-scripts webpack config
    webpackConfigPath = require.resolve('react-scripts/config/webpack.config.js', {
      paths: [devServerConfig.cypressConfig.projectRoot],
    })

    debug('Found react-scripts webpack config at %s', webpackConfigPath)
  } catch (err) {
    // Might be an ejected cra app, search for common webpack configs
    const ejectedWebpackConfigPath = path.join(devServerConfig.cypressConfig.projectRoot, 'config', 'webpack.config.js')

    try {
      webpackConfigPath = require.resolve(ejectedWebpackConfigPath)
    } catch (err) {
      throw new Error(`Failed to find webpack at ${ejectedWebpackConfigPath}. We looked in this location as we could not find the "react-scripts" dependency and are assuming an ejected create-react-app.`)
    }
  }

  try {
    let webpackConfig = require(webpackConfigPath)

    if (webpackConfig.default) {
      // we probably loaded TS file
      debug('loaded webpack options has .default - taking that as the config')
      webpackConfig = webpackConfig.default
    }

    if (typeof webpackConfig === 'function') {
      debug('calling webpack function with environment "%s"', envName)
      webpackConfig = webpackConfig('development')
    }

    return webpackConfig
  } catch (err) {
    throw new Error(`Failed to require webpack config at ${webpackConfigPath} with error: ${err}`)
  }
}

export const cypressGlobals = ['cy', 'Cypress', 'before', 'after', 'context']

function addCypressToWebpackEslintRulesInPlace (webpackConfig: Configuration) {
  const eslintPlugin = webpackConfig.plugins?.find((plugin) => plugin.constructor.name === 'ESLintWebpackPlugin') as ESLintWebpackPlugin

  if (eslintPlugin) {
    const cypressGlobalsRules = cypressGlobals
    .reduce((acc, global) => ({ ...acc, [global]: 'writable' }), {})

    eslintPlugin.options.baseConfig = {
      ...eslintPlugin.options.baseConfig,
      globals: {
        ...eslintPlugin.options.baseConfig?.globals,
        ...cypressGlobalsRules,
      },
    }

    debug('Found ESLintWebpackPlugin, modified eslint config %o', eslintPlugin.options.baseConfig)
  }
}

function getTranspileFolders (cypressConfig: Cypress.PluginConfigOptions) {
  const rawFolders: string[] = (cypressConfig as any).addTranspiledFolders ?? []
  const folders = rawFolders.map((folder) => path.resolve(cypressConfig.projectRoot, folder))

  // ensure path is absolute
  const ensureAbs = (folder: string) => {
    if (!path.isAbsolute(folder)) {
      return path.resolve(folder)
    }

    return folder
  }

  if (cypressConfig.fixturesFolder) {
    folders.push(ensureAbs(cypressConfig.fixturesFolder))
  }

  if (cypressConfig.supportFolder) {
    folders.push(ensureAbs(cypressConfig.supportFolder))
  }

  // attempt to add directories based on spec pattern
  let componentDirs = cypressConfig.specPattern || ''

  // can be string or array
  if (typeof componentDirs === 'string') {
    componentDirs = [componentDirs]
  }

  const dirsFromSpecPattern = componentDirs.reduce((acc, curr) => {
    // glob
    if (curr.includes('*')) {
      const parts = curr.slice(0, curr.indexOf('*') - 1)
      const joined = parts.split(path.sep)
      const dir = path.join(...joined)

      return acc.concat(path.resolve(cypressConfig.projectRoot, dir))
    }

    return acc
  }, [] as string[])

  return folders.concat(...dirsFromSpecPattern, path.resolve('cypress'))
}

/**
 * Finds the ModuleScopePlugin plugin and adds given folder
 * to that list. This allows react-scripts to import folders
 * outside of the default "/src" folder.
 * WARNING modifies the input webpack options argument.
 * @see https://github.com/bahmutov/cypress-react-unit-test/issues/289
 * @param {string} folderName Folder to add, should be absolute
 */
function allowModuleSourceInPlace (folderName: string, webpackConfig: Configuration) {
  if (!folderName) {
    return
  }

  if (!webpackConfig.resolve) {
    return
  }

  if (!Array.isArray(webpackConfig.resolve.plugins)) {
    return
  }

  const moduleSourcePlugin = webpackConfig.resolve.plugins.find((plugin) => {
    return typeof plugin !== 'string' && Array.isArray(plugin.appSrcs)
  }) as ResolvePluginInstance | undefined

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

/**
 * Returns true if the provided loader path includes "babel-loader".
 * Uses current OS path separator to split the loader path correctly.
 */
const isBabelLoader = (loaderPath: string) => {
  if (!loaderPath) {
    return false
  }

  const loaderPathParts = loaderPath.split(path.sep)

  return loaderPathParts.some((pathPart) => pathPart === 'babel-loader')
}

type BabelRule = { options?: { plugins?: [] }, include?: string | string[] }

const findBabelRule = (webpackConfig: Configuration) => {
  if (!webpackConfig) {
    return
  }

  if (!webpackConfig.module) {
    return
  }

  debug('webpackConfig.module %o', webpackConfig.module)
  if (!Array.isArray(webpackConfig.module.rules)) {
    return
  }

  const oneOfRule = webpackConfig.module.rules.find((rule) => {
    return typeof rule !== 'string' && Array.isArray(rule.oneOf)
  }) as RuleSetRule | undefined

  if (!oneOfRule || !oneOfRule.oneOf) {
    debug('could not find oneOfRule')

    return
  }

  debug('looking through oneOf rules')
  debug('oneOfRule.oneOf %o', oneOfRule.oneOf)
  oneOfRule.oneOf.forEach((rule) => debug('rule %o', rule))

  const babelRule = oneOfRule.oneOf.find(
    (rule) => rule.loader && isBabelLoader(rule.loader),
  )

  return babelRule as BabelRule
}

// see https://github.com/bahmutov/find-webpack/issues/7
const findBabelLoaderRule = (webpackConfig: Configuration) => {
  debug('looking for babel-loader rule')
  if (!webpackConfig) {
    return
  }

  if (!webpackConfig.module) {
    return
  }

  debug('webpackConfig.module %o', webpackConfig.module)
  if (!Array.isArray(webpackConfig.module.rules)) {
    return
  }

  debug('webpack module rules')
  webpackConfig.module.rules.forEach((rule) => {
    debug('rule %o', rule)
  })

  const babelRule = webpackConfig.module.rules.find(
    (rule) => typeof rule !== 'string' && rule.loader === 'babel-loader',
  ) as RuleSetRule | undefined

  if (!babelRule || !babelRule.test) {
    debug('could not find babel rule')

    return
  }

  debug('found Babel rule that applies to %s', babelRule.test.toString())

  return babelRule as BabelRule
}

const findBabelLoaderUseRule = (webpackConfig: Configuration) => {
  debug('looking for babel-loader rule with use property')
  if (!webpackConfig) {
    return
  }

  if (!webpackConfig.module) {
    return
  }

  debug('webpackConfig.module %o', webpackConfig.module)
  if (!Array.isArray(webpackConfig.module.rules)) {
    return
  }

  debug('webpack module rules')
  webpackConfig.module.rules.forEach((rule) => {
    debug('rule %o', rule)
  })

  const isBabelLoader = (rule: any) => rule?.use?.loader === 'babel-loader'
  const isNextBabelLoader = (rule: any) => rule?.use?.loader === 'next-babel-loader'

  const babelRule = webpackConfig.module.rules.find(
    (rule) => isBabelLoader(rule) || isNextBabelLoader(rule),
  ) as RuleSetRule | undefined

  if (!babelRule) {
    debug('could not find babel rule')

    return
  }

  debug('found Babel use rule that applies to %s', babelRule.test?.toString())

  return babelRule.use as BabelRule
}

const findBabelRuleWrap = (webpackConfig: Configuration) => {
  let babelRule = findBabelRule(webpackConfig)

  if (!babelRule) {
    debug('could not find Babel rule using oneOf')
    babelRule = findBabelLoaderRule(webpackConfig)
  }

  if (!babelRule) {
    debug('could not find Babel rule directly')
    babelRule = findBabelLoaderUseRule(webpackConfig)
  }

  if (!babelRule) {
    debug('could not find Babel rule')

    return
  }

  return babelRule
}

function addFolderToBabelLoaderTranspileInPlace (folder: string, webpackConfig: Configuration) {
  if (!folder) {
    debug('no extra folder to transpile using Babel')

    return
  }

  debug(
    'trying to transpile additional folder %s using Babel',
    folder,
  )

  const babelRule = findBabelRuleWrap(webpackConfig)

  if (!babelRule) {
    debug('could not find Babel rule')

    return
  }

  debug('babel rule %o', babelRule)

  if (!babelRule.include) {
    debug('could not find Babel include condition')

    return
  }

  if (typeof babelRule.include === 'string') {
    babelRule.include = [babelRule.include]
  }

  if (babelRule.include.includes(folder)) {
    // do not double include the same folder
    debug('babel includes rule for folder %s', folder)

    return
  }

  babelRule.include.push(folder)
  debug('added folder %s to babel rules', folder)
}

type DefinePlugin =
  | { definitions: Record<string, Record<string, any>> }
  | undefined;
type ESLintWebpackPlugin =
  | { options: { baseConfig?: { globals?: Record<string, any> } } }
  | undefined;

export function reactScriptsFiveModifications (webpackConfig: Configuration) {
  // React-Scripts sets the webpack target to ["browserslist"] which tells
  // webpack to target the browsers found within the browserslist config
  // depending on the environment (process.env.NODE_ENV). Since we set
  // process.env.NODE_ENV = "test", webpack is unable to find any browsers and errors.
  // We set BROWSERSLIST_ENV = "development" to override the default NODE_ENV search of browsers.
  if (!process.env.BROWSERSLIST_ENV) {
    process.env.BROWSERSLIST_ENV = 'development'
  }

  // We use the "development" configuration of the react-scripts webpack config.
  // There is a conflict when settings process.env.NODE_ENV = "test" since DefinePlugin
  // uses the "development" configuration and expects process.env.NODE_ENV = "development".
  const definePlugin: DefinePlugin = webpackConfig.plugins?.find(
    (plugin) => plugin.constructor.name === 'DefinePlugin',
  ) as unknown as DefinePlugin

  if (definePlugin) {
    const processEnv = definePlugin.definitions['process.env']

    processEnv.NODE_ENV = JSON.stringify('development')

    debug('Found "DefinePlugin", modified "process.env" definition %o', processEnv)
  }
}
