import debugLib from 'debug'
import type { Configuration as WebpackDevServer3Configuration } from 'webpack-dev-server-3'
import type { Configuration as WebpackDevServer4Configuration } from 'webpack-dev-server'

import type { WebpackDevServerConfig } from './devServer'
import type { SourceRelativeWebpackResult } from './helpers/sourceRelativeWebpackModules'
import { makeWebpackConfig } from './makeWebpackConfig'

const debug = debugLib('cypress:webpack-dev-server:start')

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

export async function createWebpackDevServer (
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

  const finalWebpackConfig = await makeWebpackConfig(config)
  const webpackCompiler = webpack(finalWebpackConfig)

  if (webpackDevServerMajorVersion === 4) {
    debug('using webpack-dev-server v4')

    return webpackDevServer4(config, webpackCompiler, finalWebpackConfig)
  }

  if (webpackDevServerMajorVersion === 3) {
    debug('using webpack-dev-server v3')

    return webpackDevServer3(config, webpackCompiler, finalWebpackConfig)
  }

  throw new Error(`Unsupported webpackDevServer version ${webpackDevServerMajorVersion}`)
}

function webpackDevServer4 (
  config: CreateFinalWebpackConfig,
  compiler: object,
  finalWebpackConfig: Record<string, any>,
) {
  const { devServerConfig: { cypressConfig: { devServerPublicPathRoute } } } = config
  const isOpenMode = !config.devServerConfig.cypressConfig.isTextTerminal
  const WebpackDevServer = config.sourceWebpackModulesResult.webpackDevServer.module
  const webpackDevServerConfig: WebpackDevServer4Configuration = {
    host: '127.0.0.1',
    port: 'auto',
    // @ts-ignore
    ...finalWebpackConfig?.devServer,
    devMiddleware: {
      publicPath: devServerPublicPathRoute,
      stats: finalWebpackConfig.stats ?? 'minimal',
    },
    hot: false,
    // Only enable file watching & reload when executing tests in `open` mode
    liveReload: isOpenMode,
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
  finalWebpackConfig: Record<string, any>,
) {
  const { devServerConfig: { cypressConfig: { devServerPublicPathRoute } } } = config
  const isOpenMode = !config.devServerConfig.cypressConfig.isTextTerminal
  const WebpackDevServer = config.sourceWebpackModulesResult.webpackDevServer.module
  const webpackDevServerConfig: WebpackDevServer3Configuration = {
    // @ts-ignore
    ...finalWebpackConfig.devServer ?? {},
    hot: false,
    // @ts-ignore ignore webpack-dev-server v3 type errors
    inline: false,
    publicPath: devServerPublicPathRoute,
    noInfo: false,
    stats: finalWebpackConfig.stats ?? 'minimal',
    // Only enable file watching & reload when executing tests in `open` mode
    liveReload: isOpenMode,
  }

  const server = new WebpackDevServer(compiler, webpackDevServerConfig)

  return {
    server,
    compiler,
  }
}
