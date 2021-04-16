import { startDevServer } from '@cypress/vite-dev-server'
import viteConfig from '../vite.config'

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    return startDevServer({
      options,
      viteConfig,
    })
  })

  return config
}
