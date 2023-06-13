import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    videoCompression: false, // turn off video compression for CI
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
  // These tests should run quickly / fail quickly,
  // since we intentionally causing error states for testing
  defaultCommandTimeout: 1000,
})
