const { defineConfig } = require("cypress")
const { devServer } = require("@cypress/webpack-dev-server")
const { getWebpackConfig } = require("nuxt")

module.exports = defineConfig({
  component: {
    async devServer(cypressDevServerConfig) {
      const webpackConfig = await getWebpackConfig()

      return devServer(cypressDevServerConfig, { webpackConfig })
    }
  }
})