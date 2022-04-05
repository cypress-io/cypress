import { defineConfig } from 'cypress'
import type * as vite from 'vite'


declare global {
  namespace Cypress {
    interface DefineDevServerConfig {
      viteConfig?: vite.UserConfig
    }
  }
}

// Used to inject the frame in the page
process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'

module.exports = defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: {},
    },
  },
})
