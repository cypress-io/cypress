import { HotModuleReplacementPlugin } from 'webpack'
import { debug as debugFn } from 'debug'
import * as path from 'path'
import { merge } from 'webpack-merge'
import CypressCTOptionsPlugin from './plugin'

const debug = debugFn('cypress:webpack-dev-server:makeWebpackConfig')

export async function makeWebpackConfig (userWebpackConfig = {}, { projectRoot, files, support, devserverEvents }) {
  debug(`User passed in webpack config with values`, userWebpackConfig)

  const defaultWebpackConfig = require('./webpack.config')

  debug(`Merging Evergreen's webpack config with users'`)

  debug(`New webpack entries`, files)
  debug(`Project root`, projectRoot)
  debug(`Support files`, support)

  const entry = path.resolve(__dirname, './browser.js')

  console.log('INSTALL!!!!')
  const dynamicWebpackConfig = {
    plugins: [
      new CypressCTOptionsPlugin({
        files,
        projectRoot,
        devserverEvents,
      }),
      new HotModuleReplacementPlugin()
    ],
  }

  const mergedConfig = merge(userWebpackConfig, defaultWebpackConfig, dynamicWebpackConfig)

  mergedConfig.entry = entry

  return mergedConfig
}
