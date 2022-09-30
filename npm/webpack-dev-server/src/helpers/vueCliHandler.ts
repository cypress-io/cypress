import debugLib from 'debug'
import type { Configuration } from 'webpack'
import type { PresetHandlerResult, WebpackDevServerConfig } from '../devServer'
import { sourceDefaultWebpackDependencies } from './sourceRelativeWebpackModules'

const debug = debugLib('cypress:webpack-dev-server:vueCliHandler')

export async function vueCliHandler (devServerConfig: WebpackDevServerConfig): Promise<PresetHandlerResult> {
  const sourceWebpackModulesResult = sourceDefaultWebpackDependencies(devServerConfig)

  try {
    const Service = require(require.resolve('@vue/cli-service', {
      paths: [devServerConfig.cypressConfig.projectRoot],
    }))
    let service = new Service(process.env.VUE_CLI_CONTEXT || process.cwd())

    await service.init(process.env.VUE_CLI_MODE || process.env.NODE_ENV)
    const webpackConfig = service.resolveWebpackConfig() as Configuration

    debug('webpack config %o', webpackConfig)

    return { frameworkConfig: webpackConfig, sourceWebpackModulesResult }
  } catch (e) {
    console.error(e) // eslint-disable-line no-console
    throw Error(`Error loading @vue/cli-service/lib/Service or resolving WebpackConfig. Looked in ${require.resolve.paths(devServerConfig.cypressConfig.projectRoot)}`)
  }
}
