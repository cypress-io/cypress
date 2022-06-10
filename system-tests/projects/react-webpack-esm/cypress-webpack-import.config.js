import { defineConfig } from 'cypress'
import webpackConfig from './webpack.config.js'

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig,
    },
  },
})
