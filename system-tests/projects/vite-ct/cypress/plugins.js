const { startDevServer } = require('@cypress/vite-dev-server')

module.exports = (on) => {
  on('dev-server:start', async (options) => {
    return startDevServer({
      options,
    })
  })
}
