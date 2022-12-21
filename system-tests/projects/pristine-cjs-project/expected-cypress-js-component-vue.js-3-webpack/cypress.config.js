const { defineConfig } = require('cypress')

const webpackConfig = require('./webpack.config.js')

module.exports = defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'vue',
      bundler: 'webpack',
      webpackConfig,
    },
  },
})
