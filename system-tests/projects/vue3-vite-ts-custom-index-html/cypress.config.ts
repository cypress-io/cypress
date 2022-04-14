import { defineConfig } from 'cypress'
import { devServer } from '@cypress/vite-dev-server'

export default defineConfig({
  component: {
    devServer,
    devServerConfig: {
      // optionally provide your Vite config overrides.
    },
    indexHtmlFile: 'cypress/support/custom-component-index.html'
  },
})
