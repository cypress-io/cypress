import type { CreateFinalWebpackConfig } from '../createWebpackDevServer'
import debugLib from 'debug'

type PresetHandler = Omit<CreateFinalWebpackConfig, 'frameworkConfig'>

const debug = debugLib('cypress:webpack-dev-server-fresh:vueCliHandler')

export function vueCliHandler ({ devServerConfig }: PresetHandler) {
  try {
    const config = require.resolve('@vue/cli-service/webpack.config', {
      paths: [devServerConfig.cypressConfig.projectRoot],
    })

    const webpackConfig = require(config)

    debug('webpack config %o', webpackConfig)

    return webpackConfig
  } catch (e) {
    console.error(e) // eslint-disable-line no-console
    throw Error(`Error loading @vue/cli-service/webpack.config.js. Looked in ${devServerConfig.cypressConfig.projectRoot}`)
  }
}
