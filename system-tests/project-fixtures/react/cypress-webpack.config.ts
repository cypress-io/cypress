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

export default defineConfig({
  videoCompression: false, // turn off video compression for CI
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: {
        ...require('./webpack.config.js'),
        stats: 'minimal',
      },
    },
  },
  // These tests should run quickly / fail quickly,
  // since we intentionally causing error states for testing
  defaultCommandTimeout: 1000,
})
