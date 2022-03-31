import debugLib from 'debug'
import type { WebpackDevServerConfig } from './devServer'
import type { SourceRelativeWebpackResult } from './helpers/sourceRelativeWebpack'
import { makeWebpackConfig } from './makeWebpackConfig'

const debug = debugLib('cypress:webpack-dev-server-fresh:start')

/**
 * Takes the webpack / webpackDevServer modules, the configuration provide
 * from the framework override (if any), and the configuration provided
 * from the user config (if any) and makes the final config we want to
 * serve into webpack
 */
export interface CreateFinalWebpackConfig {
  /**
   * Initial config passed to devServer
   */
  devServerConfig: WebpackDevServerConfig
  /**
   * Result of sourcing the webpack from the
   */
  sourceWebpackModulesResult: SourceRelativeWebpackResult
  /**
   * Framework-specific config overrides
   */
  frameworkConfig?: unknown
}

export function createWebpackDevServer (
  config: CreateFinalWebpackConfig,
) {
  const {
    sourceWebpackModulesResult: {
      webpack: {
        module: webpack,
      },
      webpackDevServer: {
        majorVersion: webpackDevServerMajorVersion,
      },
    },
  } = config

  const finalWebpackConfig = makeWebpackConfig(config)
  const webpackCompiler = webpack(finalWebpackConfig)

  if (webpackDevServerMajorVersion === 4) {
    debug('using webpack-dev-server v4')

    return webpackDevServer4(config, webpackCompiler, finalWebpackConfig)
  }

  if (webpackDevServerMajorVersion === 3) {
    debug('using webpack-dev-server v4')

    return webpackDevServer3(config, webpackCompiler, finalWebpackConfig)
  }

  throw new Error(`Unsupported webpackDevServer version ${webpackDevServerMajorVersion}`)
}

function webpackDevServer4 (
  config: CreateFinalWebpackConfig,
  compiler: object,
  finalWebpackConfig: object,
) {
  const { devServerConfig: { cypressConfig: { devServerPublicPathRoute } } } = config
  const WebpackDevServer = config.sourceWebpackModulesResult.webpackDevServer.module
  const webpackDevServerConfig = {
    host: 'localhost',
    port: 'auto',
    // @ts-ignore
    ...finalWebpackConfig?.devServer,
    devMiddleware: {
      publicPath: devServerPublicPathRoute,
    },
    hot: false,
  }

  const server = new WebpackDevServer(webpackDevServerConfig, compiler)

  return {
    server,
    compiler,
  }
}

function webpackDevServer3 (
  config: CreateFinalWebpackConfig,
  compiler: object,
  finalWebpackConfig: object,
) {
  const { devServerConfig: { cypressConfig: { devServerPublicPathRoute } } } = config
  const WebpackDevServer = config.sourceWebpackModulesResult.webpackDevServer.module
  const webpackDevServerConfig = {
    // @ts-ignore
    ...finalWebpackConfig.devServer ?? {},
    hot: false,
    // @ts-ignore ignore webpack-dev-server v3 type errors
    inline: false,
    publicPath: devServerPublicPathRoute,
    noInfo: false,
  }

  const server = new WebpackDevServer(compiler, webpackDevServerConfig)

  return {
    server,
    compiler,
  }
}
