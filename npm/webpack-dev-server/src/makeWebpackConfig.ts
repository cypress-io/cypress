import { debug as debugFn } from 'debug'
import * as path from 'path'
import { Configuration } from 'webpack'
import { merge } from 'webpack-merge'
import CypressCTOptionsPlugin, { CypressCTOptionsPluginOptions } from './plugin'

const debug = debugFn('cypress:webpack-dev-server:makeWebpackConfig')

const mergePublicPath = (baseValue, userValue = '/') => {
  return path.join(baseValue, userValue, '/')
}

interface MakeWebpackConfigOptions extends CypressCTOptionsPluginOptions {
  webpackDevServerPublicPathRoute: string
}

export async function makeWebpackConfig (userWebpackConfig: Configuration, options: MakeWebpackConfigOptions): Promise<Configuration> {
  const { projectRoot, webpackDevServerPublicPathRoute, files, supportFile, devServerEvents } = options

  debug(`User passed in webpack config with values %o`, userWebpackConfig)

  const defaultWebpackConfig = require('./webpack.config')

  debug(`Merging Evergreen's webpack config with users'`)

  debug(`New webpack entries %o`, files)
  debug(`Project root`, projectRoot)
  debug(`Support file`, supportFile)

  const entry = path.resolve(__dirname, './browser.js')

  const publicPath = mergePublicPath(webpackDevServerPublicPathRoute, userWebpackConfig?.output?.publicPath)

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

  const mergedConfig = merge<Configuration>(userWebpackConfig, defaultWebpackConfig, dynamicWebpackConfig)

  mergedConfig.entry = entry

  debug('Merged webpack config %o', mergedConfig)

  return mergedConfig
}
