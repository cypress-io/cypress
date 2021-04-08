import { debug as debugFn } from 'debug'
import * as path from 'path'
import * as webpack from 'webpack'
import { merge } from 'webpack-merge'
import defaultWebpackConfig from './webpack.config'
import LazyCompilePlugin from 'lazy-compile-webpack-plugin'
import CypressCTOptionsPlugin, { CypressCTOptionsPluginOptions } from './plugin'

const debug = debugFn('cypress:webpack-dev-server:makeWebpackConfig')
const WEBPACK_MAJOR_VERSION = Number(webpack.version.split('.')[0])

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

function getLazyCompilationWebpackConfig (options: MakeWebpackConfigOptions): webpack.Configuration {
  if (options.disableLazyCompilation || !options.isOpenMode) {
    return {}
  }

  switch (WEBPACK_MAJOR_VERSION) {
    case 4:
      return { plugins: [new LazyCompilePlugin()] }
    case 5:
      return { experiments: { lazyCompilation: true } } as webpack.Configuration
    default:
      return { }
  }
}

export async function makeWebpackConfig (userWebpackConfig: webpack.Configuration, options: MakeWebpackConfigOptions): Promise<webpack.Configuration> {
  const { projectRoot, devServerPublicPathRoute, files, supportFile, devServerEvents } = options

  debug(`User passed in webpack config with values %o`, userWebpackConfig)

  debug(`New webpack entries %o`, files)
  debug(`Project root`, projectRoot)
  debug(`Support file`, supportFile)

  const entry = path.resolve(__dirname, './browser.js')

  const dynamicWebpackConfig = {
    plugins: [
      new CypressCTOptionsPlugin({
        files,
        projectRoot,
        devServerEvents,
        supportFile,
      }),
    ],
  }

  const mergedConfig = merge<webpack.Configuration>(
    userWebpackConfig,
    defaultWebpackConfig,
    dynamicWebpackConfig,
    getLazyCompilationWebpackConfig(options),
  )

  // "homepage" is used as "publicPath" in react-scripts.
  // We don't want to use that during component testing.
  // In general we don't care about the user's publicPath.
  // Instead, serve all assets from the devServerPublicPathRoute.
  mergedConfig.entry = entry
  mergedConfig.output = {
    publicPath: devServerPublicPathRoute,
  }

  debug('Merged webpack config %o', mergedConfig)

  if (process.env.WEBPACK_PERF_MEASURE) {
    // only for debugging
    const { measureWebpackPerformance } = require('./measureWebpackPerformance')

    return measureWebpackPerformance(mergedConfig)
  }

  return mergedConfig
}
