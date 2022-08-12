import debugLib from 'debug'
import type { PresetHandlerResult, WebpackDevServerConfig } from '../devServer'
import { sourceDefaultWebpackDependencies } from './sourceRelativeWebpackModules'

const debug = debugLib('cypress:webpack-dev-server:nuxtHandler')

export async function nuxtHandler (devServerConfig: WebpackDevServerConfig): Promise<PresetHandlerResult> {
  const sourceWebpackModulesResult = sourceDefaultWebpackDependencies(devServerConfig)

  try {
    const nuxt = require.resolve('nuxt', {
      paths: [devServerConfig.cypressConfig.projectRoot],
    })

    const { getWebpackConfig } = require(nuxt)

    const webpackConfig = await getWebpackConfig()

    // Nuxt has asset size warnings configured by default which will cause webpack overlays to appear
    // in the browser which we don't want.
    delete webpackConfig.performance

    debug('webpack config %o', webpackConfig)

    return { frameworkConfig: webpackConfig, sourceWebpackModulesResult }
  } catch (e) {
    console.error(e) // eslint-disable-line no-console
    throw Error(`Error loading nuxt. Looked in ${require.resolve.paths(devServerConfig.cypressConfig.projectRoot)}`)
  }
}
