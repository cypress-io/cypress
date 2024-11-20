import path from 'path'
import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
      // Necessary due to cypress/react resolving from cypress/node_modules rather than the project root
      webpackConfig: {
        resolve: {
          alias: {
            'react': path.resolve(__dirname, './node_modules/react'),
            'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
          },
        },
      },
    },
    fixturesFolder: false,
  },
  // These tests should run quickly / fail quickly,
  // since we intentionally causing error states for testing
  defaultCommandTimeout: 1000,
})
