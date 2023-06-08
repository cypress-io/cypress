import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    videoCompression: false, // turn off video compression for CI
    devServer: {
      framework: 'nuxt',
      bundler: 'webpack',
      // Necessary due to cypress/vue resolving from cypress/node_modules rather than the project root
      webpackConfig: {
        resolve: {
          alias: {
            'vue': require.resolve('vue'),
          },
        },
      },
    },
  },
  // These tests should run quickly / fail quickly,
  // since we intentionally causing error states for testing
  defaultCommandTimeout: 1000,
})
