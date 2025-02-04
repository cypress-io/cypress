import { debug as debugFn } from 'debug'
import * as path from 'path'
import { merge } from 'webpack-merge'
import { importModule } from 'local-pkg'
import type { Configuration, EntryObject } from 'webpack'
import { makeCypressWebpackConfig } from './makeDefaultWebpackConfig'
import type { CreateFinalWebpackConfig } from './createWebpackDevServer'
import { configFiles } from './constants'
import { dynamicImport } from './dynamic-import'

const debug = debugFn('cypress:webpack-dev-server:makeWebpackConfig')

const removeList = [
  // We provide a webpack-html-plugin config pinned to a specific version (4.x)
  // that we have tested and are confident works with all common configurations.
  // https://github.com/cypress-io/cypress/issues/15865
  'HtmlWebpackPlugin',

  // This plugin is an optimization for HtmlWebpackPlugin for use in
  // production environments, not relevant for testing.
  'PreloadPlugin',

  // Another optimization not relevant in a testing environment.
  'HtmlPwaPlugin',

  // We already reload when webpack recompiles (via listeners on
  // devServerEvents). Removing this plugin can prevent double-refreshes
  // in some setups.
  'HotModuleReplacementPlugin',
]

// CaseSensitivePathsPlugin checks the paths of every loaded module to enforce
// case sensitivity - this helps developers on mac catch issues that will bite
// them later, but on linux the OS already does this by default. The plugin
// is somewhat slow, accounting for ~15% of compile time on a couple of CRA
// based projects (where it's included by default) tested.
if (process.platform === 'linux') {
  removeList.push('CaseSensitivePathsPlugin')
}

export const CYPRESS_WEBPACK_ENTRYPOINT = path.resolve(__dirname, 'browser.js')

/**
 * Removes and/or modifies certain plugins known to conflict
 * when used with cypress/webpack-dev-server.
 */
function modifyWebpackConfigForCypress (webpackConfig: Partial<Configuration>) {
  if (webpackConfig?.plugins) {
    webpackConfig.plugins = webpackConfig.plugins.filter((plugin) => !removeList.includes(plugin.constructor.name))
  }

  if (typeof webpackConfig?.module?.unsafeCache === 'function') {
    const originalCachePredicate = webpackConfig.module.unsafeCache

    webpackConfig.module.unsafeCache = (module: any) => {
      return originalCachePredicate(module) && !/[\\/]webpack-dev-server[\\/]dist[\\/]browser\.js/.test(module.resource)
    }
  }

  return webpackConfig
}

async function getWebpackConfigFromProjectRoot (projectRoot: string) {
  const { findUp } = await dynamicImport<typeof import('find-up')>('find-up')

  return await findUp(configFiles, { cwd: projectRoot })
}

/**
 * Creates a webpack 4/5 compatible webpack "configuration"
 * to pass to the sourced webpack function
 */
export async function makeWebpackConfig (
  config: CreateFinalWebpackConfig,
) {
  let userWebpackConfig = config.devServerConfig.webpackConfig
  const frameworkWebpackConfig = config.frameworkConfig as Partial<Configuration>

  const {
    cypressConfig: {
      projectRoot,
      supportFile,
      justInTimeCompile,
    },
    framework,
  } = config.devServerConfig

  config.devServerConfig.specs = justInTimeCompile ? [] : config.devServerConfig.specs

  if (!userWebpackConfig && !frameworkWebpackConfig) {
    debug('Not user or framework webpack config received. Trying to automatically source it')

    const configFile = await getWebpackConfigFromProjectRoot(projectRoot)

    if (configFile) {
      debug('found webpack config %s', configFile)
      const sourcedConfig = await importModule(configFile)

      debug('config contains %o', sourcedConfig)
      if (sourcedConfig && typeof sourcedConfig === 'object') {
        userWebpackConfig = sourcedConfig.default ?? sourcedConfig
      }
    }

    if (!userWebpackConfig) {
      debug('could not find webpack.config!')
      if (config.devServerConfig?.onConfigNotFound) {
        config.devServerConfig.onConfigNotFound('webpack', projectRoot, configFiles)
        // The config process will be killed from the parent, but we want to early exit so we don't get
        // any additional errors related to not having a config
        process.exit(0)
      } else {
        throw new Error(`Your Cypress devServer config is missing a required webpackConfig property, since we could not automatically detect one.\nPlease add one to your ${config.devServerConfig.cypressConfig.configFile}`)
      }
    }
  }

  userWebpackConfig = typeof userWebpackConfig === 'function'
    ? await userWebpackConfig()
    : userWebpackConfig

  const userAndFrameworkWebpackConfig = modifyWebpackConfigForCypress(
    merge(frameworkWebpackConfig ?? {}, userWebpackConfig ?? {}),
  )

  debug(`User passed in user and framework webpack config with values %o`, userAndFrameworkWebpackConfig)
  debug(`New webpack entries %o`, config.devServerConfig.specs)
  debug(`Project root`, projectRoot)
  debug(`Support file`, supportFile)

  const mergedConfig = merge(
    userAndFrameworkWebpackConfig,
    makeCypressWebpackConfig(config),
  )

  // Some frameworks (like Next.js) change this value which changes the path we would need to use to fetch our spec.
  // (eg, http://localhost:xxxx/<dev-server-public-path>/static/chunks/spec-<x>.js). Deleting this key to normalize
  // the spec URL to `*/spec-<x>.js` which we need to know up-front so we can fetch the sourcemaps.
  delete mergedConfig.output?.chunkFilename

  // Angular loads global styles and polyfills via script injection in the index.html
  if (framework === 'angular') {
    mergedConfig.entry = {
      ...(mergedConfig.entry as EntryObject) || {},
      'cypress-entry': CYPRESS_WEBPACK_ENTRYPOINT,
    }
  } else {
    mergedConfig.entry = CYPRESS_WEBPACK_ENTRYPOINT
  }

  debug('Merged webpack config %o', mergedConfig)

  return mergedConfig
}
