import Debug from 'debug'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import { makeWebpackConfig, UserWebpackDevServerOptions } from './makeWebpackConfig'

export interface StartDevServer extends UserWebpackDevServerOptions {
  /* this is the Cypress options object */
  options: Cypress.DevServerOptions
  /* support passing a path to the user's webpack config */
  webpackConfig?: Record<string, any>
}

const debug = Debug('cypress:webpack-dev-server:start')

export async function start ({ webpackConfig: userWebpackConfig, options, ...userOptions }: StartDevServer, exitProcess = process.exit): Promise<WebpackDevServer> {
  if (!userWebpackConfig) {
    debug('User did not pass in any webpack configuration')
  }

  // @ts-expect-error ?? devServerPublicPathRoute is not a valid option of Cypress.Config
  const { projectRoot, devServerPublicPathRoute, isTextTerminal } = options.config

  const webpackConfig = await makeWebpackConfig(userWebpackConfig || {}, {
    files: options.specs,
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

  const webpackDevServerConfig = {
    ...userWebpackConfig.devServer,
    hot: false,
    inline: false,
    publicPath: devServerPublicPathRoute,
  }

  return new WebpackDevServer(compiler, webpackDevServerConfig)
}
