import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin'
import * as webpackConfig from './webpack.config'

module.exports = (on, config) => {
  addMatchImageSnapshotPlugin(on, config)
  const { startDevServer } = require('@cypress/webpack-dev-server')

  on('dev-server:start', (options) => {
    return startDevServer({
      options,
      webpackConfig,
    })
  })

  require('@cypress/code-coverage/task')(on, config)

  return config
}
