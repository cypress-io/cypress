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

const port = 8888

const webpackConfig = require('./webpack.config.js')

webpackConfig.devServer ??= {}
webpackConfig.devServer.port = port

export default defineConfig({
  env: {
    PORT_CHECK: port,
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: {
        ...webpackConfig,
        stats: 'errors-only',
      },
    },
  },
  // These tests should run quickly / fail quickly,
  // since we intentionally causing error states for testing
  defaultCommandTimeout: 1000,
})
