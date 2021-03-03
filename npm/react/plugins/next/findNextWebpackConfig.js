// @ts-check
const debug = require('debug')('@cypress/react')
const loadConfig = require('next/dist/next-server/server/config').default
const getNextJsBaseWebpackConfig = require('next/dist/build/webpack-config').default

async function getNextWebpackConfig (config) {
  const nextConfig = await loadConfig('development', config.projectRoot)
  const nextWebpackConfig = await getNextJsBaseWebpackConfig(
    config.projectRoot,
    {
      buildId: `@cypress/react-${Math.random().toString()}`,
      config: nextConfig,
      dev: false,
      isServer: false,
      pagesDir: config.projectRoot,
      entrypoints: {},
      rewrites: [],
    },
  )

  // Using mode over `dev` true to get rid of next's react-refresh-plugin wrapping
  // We need do not need all the HMR and webpack dev middlewares as well
  nextWebpackConfig.mode = 'development'

  debug('resolved next.js webpack config %o', nextWebpackConfig)

  return nextWebpackConfig
}

let webpackConfigCache = null

/** Resolving next.js webpack and all config with plugin takes long, so cache the webpack configuration */
module.exports = async function findNextWebpackConfig (config) {
  // ⛔️ ⛔️ Comment this `if` for debugging
  if (webpackConfigCache !== null) {
    return webpackConfigCache
  }

  webpackConfigCache = await getNextWebpackConfig(config)

  debug('created and cached webpack preprocessor based on next.config.js', webpackConfigCache)

  return webpackConfigCache
}
