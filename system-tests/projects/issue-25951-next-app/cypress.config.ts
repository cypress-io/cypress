import { defineConfig } from 'cypress'

export default defineConfig({
  videoCompression: false, // turn off video compression for CI
  component: {
    fixturesFolder: false,
    supportFile: false,
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})
