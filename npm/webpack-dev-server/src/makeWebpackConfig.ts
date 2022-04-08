import { debug as debugFn } from 'debug'
import * as path from 'path'
import * as webpack from 'webpack'
import { merge } from 'webpack-merge'
import makeDefaultWebpackConfig from './webpack.config'
import CypressCTOptionsPlugin, { CypressCTOptionsPluginOptionsWithEmitter } from './plugin'

const debug = debugFn('cypress:webpack-dev-server:makeWebpackConfig')

const removeList = [
  // We provide a webpack-html-plugin config pinned to a specific version (4.x)
  // that we have tested and are confident works with all common configurations.
  // https://github.com/cypress-io/cypress/issues/15865
  'HtmlWebpackPlugin',

  // This plugin is an opitimization for HtmlWebpackPlugin for use in
  // production environments, not relevent for testing.
  'PreloadPlugin',

  // Another optimization not relevent in a testing environment.
  'HtmlPwaPlugin',

  // We already reload when webpack recomplies (via listeners on
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

export interface UserWebpackDevServerOptions {
  /**
   * if `true` will compile all the specs together when the first one is request and can slow up initial build time.
   * @default false
  */
  disableLazyCompilation?: boolean
}

interface MakeWebpackConfigOptions extends CypressCTOptionsPluginOptionsWithEmitter, UserWebpackDevServerOptions {
  devServerPublicPathRoute: string
  isOpenMode: boolean
  indexHtmlFile: string
}

const OsSeparatorRE = RegExp(`\\${path.sep}`, 'g')
const posixSeparator = '/'

export async function makeWebpackConfig (userWebpackConfig: webpack.Configuration, options: MakeWebpackConfigOptions): Promise<webpack.Configuration> {
  const { projectRoot, devServerPublicPathRoute, files, supportFile, devServerEvents, indexHtmlFile } = options

  debug(`User passed in webpack config with values %o`, userWebpackConfig)

  debug(`New webpack entries %o`, files)
  debug(`Project root`, projectRoot)
  debug(`Support file`, supportFile)

  const entry = path.resolve(__dirname, './browser.js')
  const publicPath = (path.sep === posixSeparator)
    ? path.join(devServerPublicPathRoute, posixSeparator)
    // The second line here replaces backslashes on windows with posix compatible slash
    // See https://github.com/cypress-io/cypress/issues/16097
    : path.join(devServerPublicPathRoute, posixSeparator)
    .replace(OsSeparatorRE, posixSeparator)

  const dynamicWebpackConfig = {
    output: {
      publicPath,
    },
    plugins: [
      new CypressCTOptionsPlugin({
        files,
        projectRoot,
        devServerEvents,
        supportFile,
      }),
    ],
  }

  if (userWebpackConfig?.plugins) {
    userWebpackConfig.plugins = userWebpackConfig.plugins.filter((plugin) => {
      if (removeList.includes(plugin.constructor.name)) {
        /* eslint-disable no-console */
        console.warn(`[@cypress/webpack-dev-server]: removing ${plugin.constructor.name} from configuration.`)

        return false
      }

      return true
    })
  }

  if (typeof userWebpackConfig?.module?.unsafeCache === 'function') {
    const originalCachePredicate = userWebpackConfig.module.unsafeCache

    userWebpackConfig.module.unsafeCache = (module: any) => {
      return originalCachePredicate(module) && !/[\\/]webpack-dev-server[\\/]dist[\\/]browser\.js/.test(module.resource)
    }
  }

  const mergedConfig = merge<webpack.Configuration>(
    userWebpackConfig,
    makeDefaultWebpackConfig(indexHtmlFile),
    dynamicWebpackConfig,
  )

  mergedConfig.entry = entry

  debug('Merged webpack config %o', mergedConfig)

  if (process.env.WEBPACK_PERF_MEASURE) {
    // only for debugging
    const { measureWebpackPerformance } = require('./measureWebpackPerformance')

    return measureWebpackPerformance(mergedConfig)
  }

  return mergedConfig
}
