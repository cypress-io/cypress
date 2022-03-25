import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin'
import webpackConfig from './webpack.config'

module.exports = (on, config) => {
  addMatchImageSnapshotPlugin(on, config)

  on('dev-server:start', (options) => {
    const { startDevServer } = require('@cypress/webpack-dev-server')

    return startDevServer({
      options,
      webpackConfig,
    })
  })

  require('@cypress/code-coverage/task')(on, config)

  return config
}
