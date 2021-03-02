const { startDevServer } = require('@cypress/rollup-dev-server')
const rollupConfig = require('../rollup.config.js').default

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    return startDevServer({ options, rollupConfig })
  })

  return config
}
