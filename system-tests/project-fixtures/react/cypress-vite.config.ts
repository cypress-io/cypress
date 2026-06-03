import { defineConfig } from 'cypress'
import viteConfig from './vite.config.js'
import type * as vite from 'vite'

declare global {
  namespace Cypress {
    interface DefineDevServerConfig {
      viteConfig?: vite.UserConfig
    }
  }
}

const port = 8888

viteConfig.server ??= {}
viteConfig.server.port = port

export default defineConfig({
  allowCypressEnv: false,
  env: {
    PORT_CHECK: port,
  },
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
