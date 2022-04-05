import { defineConfig } from 'cypress'
import type * as vite from 'vite'


declare global {
  namespace Cypress {
    interface DefineDevServerConfig {
      viteConfig?: vite.UserConfig
    }
  }
}

module.exports = defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: {},
    },
  },
})
