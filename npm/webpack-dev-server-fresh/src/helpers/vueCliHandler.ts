import debugLib from 'debug'
import type { Configuration } from 'webpack'
import type { PresetHandlerResult, WebpackDevServerConfig } from '../devServer'
import { sourceDefaultWebpackDependencies } from './sourceRelativeWebpackModules'

const debug = debugLib('cypress:webpack-dev-server-fresh:vueCliHandler')

export function vueCliHandler (devServerConfig: WebpackDevServerConfig): PresetHandlerResult {
  const sourceWebpackModulesResult = sourceDefaultWebpackDependencies(devServerConfig)

  try {
    const config = require.resolve('@vue/cli-service/webpack.config', {
      paths: [devServerConfig.cypressConfig.projectRoot],
    })

    const webpackConfig = require(config) as Configuration

    debug('webpack config %o', webpackConfig)

    return { frameworkConfig: webpackConfig, sourceWebpackModulesResult }
  } catch (e) {
    console.error(e) // eslint-disable-line no-console
    throw Error(`Error loading @vue/cli-service/webpack.config.js. Looked in ${require.resolve.paths(devServerConfig.cypressConfig.projectRoot)}`)
  }
}
