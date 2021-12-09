import Debug from 'debug'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import { makeWebpackConfig, UserWebpackDevServerOptions } from './makeWebpackConfig'
import { webpackDevServerFacts } from './webpackDevServerFacts'

export interface StartDevServer extends UserWebpackDevServerOptions {
  /* this is the Cypress dev server configuration object */
  options: Cypress.DevServerConfig
  /* Base webpack config object used for loading component testing */
  webpackConfig?: WebpackConfigurationWithDevServer
  /* base html template to render in AUT */
  template?: string
  /* base html template to render in AUT */
  indexHtml?: string

}

export interface WebpackConfigurationWithDevServer extends webpack.Configuration {
  devServer?: WebpackDevServer.Configuration
}

const debug = Debug('cypress:webpack-dev-server:start')

export async function start ({ webpackConfig: userWebpackConfig, indexHtml, options, ...userOptions }: StartDevServer, exitProcess = process.exit): Promise<WebpackDevServer> {
  if (!userWebpackConfig) {
    debug('User did not pass in any webpack configuration')
  }

  const { projectRoot, devServerPublicPathRoute, isTextTerminal } = options.config

  const webpackConfig = await makeWebpackConfig(userWebpackConfig || {}, {
    files: options.specs,
    indexHtml,
    projectRoot,
    devServerPublicPathRoute,
    devServerEvents: options.devServerEvents,
    supportFile: options.config.supportFile as string,
    isOpenMode: !isTextTerminal,
    ...userOptions,
  })

  debug('compiling webpack')

  const compiler = webpack(webpackConfig)

  // When compiling in run mode
  // Stop the clock early, no need to run all the tests on a failed build
  if (isTextTerminal) {
    compiler.hooks.done.tap('cyCustomErrorBuild', function (stats) {
      if (stats.hasErrors()) {
        exitProcess(1)
      }
    })
  }

  debug('starting webpack dev server')
  let webpackDevServerConfig: WebpackDevServer.Configuration = {
    ...(userWebpackConfig?.devServer || {}),
    hot: false,
  }

  if (webpackDevServerFacts.isV3()) {
    debug('using webpack-dev-server v3')
    webpackDevServerConfig = {
      ...webpackDevServerConfig,
      // @ts-ignore ignore webpack-dev-server v3 type errors
      inline: false,
      publicPath: devServerPublicPathRoute,
      noInfo: false,
    }

    // @ts-ignore ignore webpack-dev-server v3 type errors
    return new WebpackDevServer(compiler, webpackDevServerConfig)
  }

  if (webpackDevServerFacts.isV4()) {
    debug('using webpack-dev-server v4')
    webpackDevServerConfig = {
      host: 'localhost',
      port: 'auto',
      ...userWebpackConfig?.devServer,
      devMiddleware: {
        publicPath: devServerPublicPathRoute,
      },
      hot: false,
    }

    // @ts-expect-error Webpack types are clashing between Webpack and WebpackDevServer
    return new WebpackDevServer(webpackDevServerConfig, compiler)
  }

  throw webpackDevServerFacts.unsupported()
}
