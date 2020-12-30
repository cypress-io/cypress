import webpack from 'webpack'
import { debug as debugFn } from 'debug'
import WebpackDevServer from 'webpack-dev-server'
import fw from 'find-webpack'
const debug = debugFn('cypress:webpack-dev-server:start')

import { makeWebpackConfig } from './makeWebpackConfig'

export async function start (initialWebpackConfig, { specs, config, devserverEvents }): Promise<WebpackDevServer> {
  if (initialWebpackConfig == null) {
    debug('User did not pass in any webpack configuration')
    // TODO: implement a method in find-webpack to return the path where it found the configuration
    initialWebpackConfig = fw.getWebpackOptions()
  }

  const webpackConfig = await makeWebpackConfig(initialWebpackConfig, {
    files: specs,
    projectRoot: config.projectRoot,
    support: '',
    devserverEvents,
  })

  debug('compiling webpack')

  const compiler = webpack(webpackConfig)

  debug('starting webpack dev server')

  return new WebpackDevServer(compiler, { hot: true })
}
