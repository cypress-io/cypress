import Debug from 'debug'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import { StartDevServer } from '.'
import { makeWebpackConfig } from './makeWebpackConfig'

const debug = Debug('cypress:webpack-dev-server:start')

export async function start ({ webpackConfig: userWebpackConfig, options, ...userOptions }: StartDevServer, exitProcess = process.exit): Promise<WebpackDevServer> {
  if (!userWebpackConfig) {
    debug('User did not pass in any webpack configuration')
  }

  // @ts-expect-error ?? webpackDevServerPublicPathRoute is not a valid option of Cypress.Config
  const { projectRoot, webpackDevServerPublicPathRoute, isTextTerminal } = options.config

  const webpackConfig = await makeWebpackConfig(userWebpackConfig || {}, {
    files: options.specs,
    projectRoot,
    webpackDevServerPublicPathRoute,
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

  // TODO: write a test for how we are NOT modifying publicPath
  // here, and instead stripping it out of the cypress proxy layer
  //
  // ...this prevents a problem if users have a 'before' or 'after'
  // function defined in their webpack config, it does NOT
  // interfere with their routes... otherwise the public
  // path we are prefixing like /__cypress/src/ would be
  // prepended to req.url and cause their routing handlers to fail
  //
  // NOTE: we are merging in webpackConfig.devServer here so
  // that user values for the devServer get passed on correctly
  // since we are passing in the compiler directly, and these
  // devServer options would otherwise get ignored
  const webpackDevServerConfig = {
    ...userWebpackConfig.devServer,
    hot: false,
    inline: false,
  }

  return new WebpackDevServer(compiler, webpackDevServerConfig)
}
