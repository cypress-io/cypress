import webpack from 'webpack'
import webpackDevServer from 'webpack-dev-server'

import { makeWebpackConfig } from './makeWebpackConfig'

export async function start (userWebpackConfig = {}, testConfig) {
  const webpackConfig = await makeWebpackConfig(userWebpackConfig, testConfig)
  const compiler = webpack(webpackConfig)

  return new webpackDevServer(compiler, { hot: true })
}
