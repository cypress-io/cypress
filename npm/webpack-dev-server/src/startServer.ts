import webpack from 'webpack'
import { debug as debugFn } from 'debug'
import WebpackDevServer from 'webpack-dev-server'
const debug = debugFn('cypress:webpack-dev-server:start')

import { makeWebpackConfig } from './makeWebpackConfig'

export async function start (userWebpackConfig = {}, { specs, config, devserverEvents }): Promise<WebpackDevServer> {
  const webpackConfig = await makeWebpackConfig(userWebpackConfig, {
    files: specs,
    projectRoot: config.projectRoot,
    support: '',
    devserverEvents,
  })

  debug('compiling webpack')

  const compiler = webpack(webpackConfig)

  debug('starting webpack dev server')

  return new WebpackDevServer(compiler, { hot: true, noInfo: !debug.enabled })
}
