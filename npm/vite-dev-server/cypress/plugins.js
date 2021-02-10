import { startDevServer } from '@cypress/vite-dev-server'

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    return startDevServer({ options })
  })

  return config
}
