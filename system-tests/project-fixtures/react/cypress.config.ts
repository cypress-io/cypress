import { defineConfig } from 'cypress'
import type * as webpack from 'webpack'
import type * as webpackDevServer from 'webpack-dev-server'

declare global {
  namespace Cypress {
    interface DefineDevServerConfig {
      webpackConfig?: webpack.Configuration & {
        devServer?: webpackDevServer.Configuration
      }
    }
  }
}

module.exports = defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: {
        ...require('./webpack.config.js'),
        stats: 'minimal'
      },
    },
  },
})
