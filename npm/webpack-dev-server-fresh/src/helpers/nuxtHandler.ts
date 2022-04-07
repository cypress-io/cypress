import type { CreateFinalWebpackConfig } from '../createWebpackDevServer'
import debugLib from 'debug'
import type { Configuration } from 'webpack'

type PresetHandler = Omit<CreateFinalWebpackConfig, 'frameworkConfig'>

const debug = debugLib('cypress:webpack-dev-server-fresh:nuxtHandler')

export async function nuxtHandler ({ devServerConfig }: PresetHandler): Promise<Configuration> {
  try {
    const nuxt = require.resolve('nuxt', {
      paths: [devServerConfig.cypressConfig.projectRoot],
    })

    const { getWebpackConfig } = require(nuxt)

    const webpackConfig = await getWebpackConfig()

    debug('webpack config %o', webpackConfig)

    return webpackConfig
  } catch (e) {
    console.error(e) // eslint-disable-line no-console
    throw Error(`Error loading nuxt. Looked in ${devServerConfig.cypressConfig.projectRoot}`)
  }
}
