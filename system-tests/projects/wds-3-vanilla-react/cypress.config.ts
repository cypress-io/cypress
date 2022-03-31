import { defineConfig } from 'cypress'

module.exports = defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: require('./webpack.config.js'),
    },
  },
})
