const { defineConfig } = require('cypress')
const { devServer } = require('@cypress/webpack-dev-server')
const { getWebpackConfig } = require('nuxt')

module.exports = defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    async devServer (cypressDevServerConfig, devServerConfig) {
      const webpackConfig = await getWebpackConfig()

      // Whenever we need to test Vue 2, make sure to add this to the
      // Webpack configuration options
      // Because of #UNIFY-1565 we clash with Cypress's own
      // Vue 3 installation.
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        alias: {
          ...(webpackConfig.resolve?.alias ?? {}),
          'vue': require.resolve('vue'),
        },
      }

      return devServer({ ...cypressDevServerConfig, webpackConfig })
    },
  },
})
