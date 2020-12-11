import webpack from 'webpack'
import webpackDevServer from 'webpack-dev-server'

import { makeWebpackConfig } from './makeWebpackConfig'

export async function start (userWebpackConfig = {}, testConfig) {
  const webpackConfig = await makeWebpackConfig(userWebpackConfig, testConfig)
  const compiler = webpack(webpackConfig)

  const devserver = new webpackDevServer(compiler, { hot: true })

  return new Promise((resolve) => {
    setTimeout(() => resolve(devserver), 5000)
    // const cb = (line) => {
    //   console.log('on data?', line.toString())
    //   if (line.toString().contains('Compiled successfully.')) {
    //     console.log('FOUND compiled successfully')
    //     process.stdout.removeListener('data', cb)
    //     resolve(devserver)
    //   }
    // }
    //
    // process.stderr.on('data', (l) => console.error(`stderr: ${l.toString()}`))
    // process.stdout.on('data', cb)
  })
}
