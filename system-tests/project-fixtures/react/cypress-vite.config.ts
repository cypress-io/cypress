import { defineConfig } from 'cypress'

import type * as vite from 'vite'

declare global {
  namespace Cypress {
    interface DefineDevServerConfig {
      viteConfig?: vite.UserConfig
    }
  }
}

const port = 8888

const viteConfig = require('./webpack.config.js')

viteConfig.server ??= {}
viteConfig.server.port = port

export default defineConfig({
  env: {
    PORT_CHECK: port,
  },
  videoCompression: false, // turn off video compression for CI
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: {
        ...viteConfig,
      },
    },
  },
  // These tests should run quickly / fail quickly,
  // since we intentionally causing error states for testing
  defaultCommandTimeout: 1000,
})
