import { defineConfig } from 'cypress'
import { devServer } from '@cypress/vite-dev-server'

export default defineConfig({
  component: {
    devServer,
    devServerConfig: {
      indexHtmlFile: 'cypress/support/component-index.html',
      // optionally provide your Vite config overrides.
    },
  },
})
