import { defineConfig } from 'cypress'
import { devServer } from '@cypress/react/plugins/react-scripts'

export default defineConfig({
  videoCompression: false, // turn off video compression for CI
  component: {
    devServer,
  },
})
