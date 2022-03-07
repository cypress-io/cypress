import { debug as debugFn } from 'debug'
import * as path from 'path'
import * as webpack from 'webpack'
import { merge } from 'webpack-merge'
import makeDefaultWebpackConfig from './webpack.config'
import CypressCTOptionsPlugin, { CypressCTOptionsPluginOptionsWithEmitter } from './plugin'

const debug = debugFn('cypress:webpack-dev-server:makeWebpackConfig')

const removeList = ['HtmlWebpackPlugin', 'PreloadPlugin', 'HtmlPwaPlugin']

export interface UserWebpackDevServerOptions {
  /**
   * if `true` will compile all the specs together when the first one is request and can slow up initial build time.
   * @default false
  */
  disableLazyCompilation?: boolean
}

interface MakeWebpackConfigOptions extends CypressCTOptionsPluginOptionsWithEmitter, UserWebpackDevServerOptions {
  publicPath: string
  isOpenMode: boolean
  indexHtml?: string
}

export async function makeWebpackConfig (userWebpackConfig: webpack.Configuration, options: MakeWebpackConfigOptions): Promise<webpack.Configuration> {
  const { publicPath, projectRoot, files, supportFile, devServerEvents, indexHtml } = options

  debug(`User passed in webpack config with values %o`, userWebpackConfig)

  debug(`New webpack entries %o`, files)
  debug(`Project root`, projectRoot)
  debug(`Support file`, supportFile)

  const dynamicWebpackConfig = {
    optimization: {
      splitChunks: {
        chunks: 'async' as 'async',
        // Two async module requests: The support file, and the spec being loaded.
        // This setting forces the spec file into its own chunk,
        // rather than letting it get split out into various chunks depending
        // on which specs we're actually compiling. This means it doesn't need to get
        // rebuilt between requests, saving compilation time.

        // Not allowing modules to share dependencies increases the total size
        // of compiled javascript, but decreases compilation time and increases
        // cacheability significantly, because the chunks needed to load specs
        // don't change based on what order compilation is requested in.
        maxAsyncRequests: 2,
      },
    },
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
    makeDefaultWebpackConfig(indexHtml),
    dynamicWebpackConfig,
  )

  mergedConfig.entry = {
    main: path.resolve(__dirname, './browser.js'),
  }

  // While the spec file is `import`ed in browser.js, having it as a separate
  // entrypoint ensures that it's assigned its own chunk. This ensures it
  // doesn't get reemitted, even when the list of active specs changes (and
  // browser.js is recompiled).
  if (supportFile) {
    mergedConfig.entry.support = path.resolve(projectRoot, supportFile)
  }

  debug('Merged webpack config %o', mergedConfig)

  if (process.env.WEBPACK_PERF_MEASURE) {
    // only for debugging
    const { measureWebpackPerformance } = require('./measureWebpackPerformance')

    return measureWebpackPerformance(mergedConfig)
  }

  return mergedConfig
}
