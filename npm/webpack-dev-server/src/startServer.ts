import webpack from 'webpack'
import webpackDevServer from 'webpack-dev-server'

import { makeWebpackConfig } from './makeWebpackConfig'

export async function start (userWebpackConfig = {}, { specs, config }) {
  const webpackConfig = await makeWebpackConfig(userWebpackConfig, {
    files: specs,
    projectRoot: config.projectRoot,
    support: '',
  })
  const compiler = webpack(webpackConfig)

  return new webpackDevServer(compiler, { hot: true, noInfo: true })
}
