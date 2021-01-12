import { debug as debugFn } from 'debug'
import * as path from 'path'
import { merge } from 'webpack-merge'
import CypressCTOptionsPlugin from './plugin'

const debug = debugFn('cypress:webpack-dev-server:makeWebpackConfig')

const mergePublicPath = (baseValue, userValue = '/') => {
  return path.join(baseValue, userValue, '/')
}

export async function makeWebpackConfig (userWebpackConfig, config) {
  const { projectRoot, webpackDevServerPublicPathRoute, files, support, devServerEvents } = config

  debug(`User passed in webpack config with values %o`, userWebpackConfig)

  const defaultWebpackConfig = require('./webpack.config')

  debug(`Merging Evergreen's webpack config with users'`)

  debug(`New webpack entries %o`, files)
  debug(`Project root`, projectRoot)
  debug(`Support files`, support)

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
        support,
      }),
    ],
  }

  const mergedConfig = merge(userWebpackConfig, defaultWebpackConfig, dynamicWebpackConfig)

  mergedConfig.entry = entry

  debug('Merged webpack config %o', mergedConfig)

  return mergedConfig
}
