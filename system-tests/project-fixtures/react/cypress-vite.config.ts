import { defineConfig } from 'cypress'
import type * as vite from 'vite'

declare global {
  namespace Cypress {
    interface DefineDevServerConfig {
      viteConfig?: vite.UserConfig
    }
  }
}

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
  // These tests should run quickly / fail quickly,
  // since we intentionally causing error states for testing
  defaultCommandTimeout: 1000,
})
