import Debug from 'debug'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import { StartDevServer } from '.'
import { makeWebpackConfig } from './makeWebpackConfig'

const debug = Debug('cypress:webpack-dev-server:start')

export async function start ({ webpackConfig: initialWebpackConfig, webpackConfigPath, options }: StartDevServer): Promise<WebpackDevServer> {
  if (initialWebpackConfig == null && webpackConfigPath) {
    debug('User did not pass in any webpack configuration')
    // TODO: implement a method in find-webpack to return the path where it found the configuration
    try {
      initialWebpackConfig = require(webpackConfigPath)
    } catch (e) {
      const err = `Could not find webpack config at provided path: ${webpackConfigPath}`

      debug(err)
      throw Error(err)
    }
  }

  const { projectRoot, webpackDevServerPublicPathRoute } = options.config

  const webpackConfig = await makeWebpackConfig(initialWebpackConfig, {
    files: options.specs,
    projectRoot,
    webpackDevServerPublicPathRoute,
    support: '',
    devServerEvents: options.devServerEvents,
  })

  debug('compiling webpack')

  const compiler = webpack(webpackConfig)

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
    ...webpackConfig.devServer,
    hot: true,
    inline: false,
    sockPath: '/cypress-webpack-hmr-socket',
  }

  return new WebpackDevServer(compiler, webpackDevServerConfig)
}
