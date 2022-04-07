import type { CreateFinalWebpackConfig } from '../createWebpackDevServer'
import debugLib from 'debug'
import type { WebpackPluginFunction } from 'webpack'

type PresetHandler = Omit<CreateFinalWebpackConfig, 'frameworkConfig'>

const debug = debugLib('cypress:webpack-dev-server-fresh:vueCliHandler')

export function vueCliHandler ({ devServerConfig }: PresetHandler) {
  try {
    const config = require.resolve('@vue/cli-service/webpack.config', {
      paths: [devServerConfig.cypressConfig.projectRoot],
    })

    const webpackConfig = require(config)

    debug('webpack config %o', webpackConfig)

    return {
      ...webpackConfig,
      plugins: (webpackConfig.plugins || []).filter((x: WebpackPluginFunction) => {
        return x.constructor.name !== 'HtmlPwaPlugin' && x.constructor.name !== 'HtmlWebpackPlugin'
      }),
    }
  } catch (e) {
    console.error(e) // eslint-disable-line no-console
    throw Error(`Error loading @vue/cli-service/webpack.config.js. Looked in ${devServerConfig.cypressConfig.projectRoot}`)
  }
}
