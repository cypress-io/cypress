// import debugLib from 'debug'
import type { PresetHandlerResult, WebpackDevServerConfig } from '../devServer'
import { sourceDefaultWebpackDependencies } from './sourceRelativeWebpackModules'
import { pathToFileURL } from 'url'

const dynamicImport = new Function('specifier', 'return import(specifier)')

const importModule = (specifier: string, projectRoot: string) => {
  const depPath = require.resolve(specifier, { paths: [projectRoot] })

  const url = pathToFileURL(depPath).href

  return dynamicImport(url)
}

export async function nuxtHandler (devServerConfig: WebpackDevServerConfig): Promise<PresetHandlerResult> {
  const sourceWebpackModulesResult = sourceDefaultWebpackDependencies(devServerConfig)

  const { projectRoot } = devServerConfig.cypressConfig
  const { loadNuxt } = await importModule('nuxt', projectRoot)
  const { getWebpackConfigs } = await importModule('@nuxt/webpack-builder', projectRoot)

  const nuxt = await loadNuxt({ cwd: projectRoot, dev: true, ready: true })

  const webpackConfig = (await getWebpackConfigs(nuxt))[0]

  delete webpackConfig.entry

  return { frameworkConfig: webpackConfig, sourceWebpackModulesResult }

  // try {
  //   const nuxt = require.resolve('nuxt', {
  //     paths: [devServerConfig.cypressConfig.projectRoot],
  //   })

  //   const { getWebpackConfig } = require(nuxt)

  //   const webpackConfig = await getWebpackConfig()

  //   // Nuxt has asset size warnings configured by default which will cause webpack overlays to appear
  //   // in the browser which we don't want.
  //   delete webpackConfig.performance
  //   delete webpackConfig.entry

  //   debug('webpack config %o', webpackConfig)

  //   return { frameworkConfig: webpackConfig, sourceWebpackModulesResult }
  // } catch (e) {
  //   console.error(e) // eslint-disable-line no-console
  //   throw Error(`Error loading nuxt. Looked in ${require.resolve.paths(devServerConfig.cypressConfig.projectRoot)}`)
  // }
}
