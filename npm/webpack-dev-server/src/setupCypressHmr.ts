import * as webpack from 'webpack'
import Debug from 'debug'
const debug = Debug('cypress:webpack-dev-server:hmr')

export function setupCypressHmr (webpackCompiler: webpack.Compiler) {
  const { compile, invalid, done } = webpackCompiler.hooks

  debug('subscribing to webpack compiler hooks')

  compile.tap('cypress-webpack-dev-server', () => console.log('COMPILE'))
  invalid.tap('cypress-webpack-dev-server', () => console.log('INVALID'))
  done.tap('cypress-webpack-dev-server', (stats: webpack.Stats) => {
    // const shouldRestart = stats && stats.hasErrors())

    console.log('STATS CLOMP', stats.compilation.errors)
    // this.sendStats(this.sockets, this.getStats(stats))
    // this.stats = stats
  })

  debug('subscribed to webpack compiler hooks, starting hmr')
}
