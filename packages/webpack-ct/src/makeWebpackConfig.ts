import { debug as debugFn } from 'debug'
import * as path from 'path'
import { merge } from 'webpack-merge'
import CypressCTOptionsPlugin from './plugin'

const debug = debugFn('cypress:evergreen:webpack')

export async function makeWebpackConfig (userWebpackConfig = {}, { projectRoot, files, support, devserverEvents }) {
  debug(`User passed in webpack config with values`, userWebpackConfig)

  const defaultWebpackConfig = require('./webpack.config')

  debug(`Merging Evergreen's webpack config with users'`)

  debug(`Support files`, support)

  debug(`New webpack entries`, files)

  const entry = path.resolve(__dirname, './browser.js')

  const dynamicWebpackConfig = {
    plugins: [
      new CypressCTOptionsPlugin({
        files,
        projectRoot,
        devserverEvents,
      }),
    ],
  }

  const mergedConfig = merge(userWebpackConfig, defaultWebpackConfig, dynamicWebpackConfig)

  mergedConfig.entry = entry

  return mergedConfig
}
