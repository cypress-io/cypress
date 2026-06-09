import { defineConfig } from 'cypress'
import { devServer } from '@cypress/vite-dev-server'

// import.meta.resolve must be present within an ESM context
import.meta.resolve

export default defineConfig({
  allowCypressEnv: false,
  component: {
    experimentalSingleTabRunMode: true,
    specPattern: 'src/**/*.ts',
    indexHtmlFile: 'component-index.html',
    supportFile: false,
    async setupNodeEvents (_, config) {
      await import('find-up')

      return config
    },
    async devServer (...args) {
      await import('find-up')

      return devServer(...args)
    },
  },
})
