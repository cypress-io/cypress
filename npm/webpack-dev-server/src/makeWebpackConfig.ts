import { debug as debugFn } from 'debug'
import * as path from 'path'
import * as webpack from 'webpack'
import { merge } from 'webpack-merge'
import defaultWebpackConfig from './webpack.config'
import CypressCTOptionsPlugin, { CypressCTOptionsPluginOptions } from './plugin'

const debug = debugFn('cypress:webpack-dev-server:makeWebpackConfig')

const removeList = ['HtmlWebpackPlugin', 'PreloadPlugin']

export interface UserWebpackDevServerOptions {
  /**
   * if `true` will compile all the specs together when the first one is request and can slow up initial build time.
   * @default false
  */
  disableLazyCompilation?: boolean
}

interface MakeWebpackConfigOptions extends CypressCTOptionsPluginOptions, UserWebpackDevServerOptions {
  devServerPublicPathRoute: string
  isOpenMode: boolean
}

export async function makeWebpackConfig (userWebpackConfig: webpack.Configuration, options: MakeWebpackConfigOptions): Promise<webpack.Configuration> {
  const { projectRoot, devServerPublicPathRoute, files, supportFile, devServerEvents } = options

  debug(`User passed in webpack config with values %o`, userWebpackConfig)

  debug(`New webpack entries %o`, files)
  debug(`Project root`, projectRoot)
  debug(`Support file`, supportFile)

  const entry = path.resolve(__dirname, './browser.js')

  // The second line here replaces backslashes on windows with posix compatible slash
  // See https://github.com/cypress-io/cypress/issues/16097
  const publicPath = path.join(devServerPublicPathRoute, '/')
  .replace(/\\/g, '/')

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

  // certain plugins conflict with HtmlWebpackPlugin and cause
  // problems for some setups.
  // most of these are application optimizations that are not relevant in a
  // testing environment.
  // remove those plugins to ensure a smooth configuration experience.
  // we provide a webpack-html-plugin config pinned to a specific version (4.x)
  // that we have tested and are confident works with all common configurations.
  // https://github.com/cypress-io/cypress/issues/15865
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

  const mergedConfig = merge<webpack.Configuration>(
    userWebpackConfig,
    defaultWebpackConfig,
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
