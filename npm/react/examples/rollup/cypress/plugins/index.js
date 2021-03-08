// @ts-check
const path = require('path')
const { startDevServer } = require('@cypress/rollup-dev-server')

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    return startDevServer({
      options,
      rollupConfig: path.resolve(__dirname, '..', '..', 'rollup.config.js'),
    })
  })

  return config
}
