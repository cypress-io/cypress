import { defineConfig } from 'cypress'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: async (baseConfig) => {
        console.log(baseConfig)
        fs.writeFileSync(path.join(__dirname, 'wrote-to-file'), 'OK')

        return await import('./webpack.config.js')
      },
    },
  },
  // These tests should run quickly / fail quickly,
  // since we intentionally causing error states for testing
  defaultCommandTimeout: 1000,
})
