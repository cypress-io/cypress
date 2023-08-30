import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    fixturesFolder: false,
    supportFile: false,
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})
