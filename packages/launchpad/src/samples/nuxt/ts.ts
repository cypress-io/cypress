import { defineConfig } from 'cypress'
import { startDevServer } from '@cypress/webpack-dev-server'
import { getWebpackConfig } from 'nuxt'

export default defineConfig({
  component (on, config) {
    on('dev-server:start', async (options) => {
      let webpackConfig = await getWebpackConfig('modern', 'dev')

      return startDevServer({
        options,
        webpackConfig,
      })
    })
  },
})
