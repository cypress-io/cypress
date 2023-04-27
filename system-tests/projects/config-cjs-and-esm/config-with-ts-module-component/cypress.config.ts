import { defineConfig } from 'cypress'
import { devServer } from '@cypress/vite-dev-server'

export default defineConfig({
  videoCompression: false, // turn off video compression for CI
  component: {
    experimentalSingleTabRunMode: true,
    specPattern: 'src/**/*.ts',
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
