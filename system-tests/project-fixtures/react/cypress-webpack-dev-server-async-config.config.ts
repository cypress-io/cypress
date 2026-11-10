import { defineConfig } from 'cypress'
import * as path from 'path'
import * as fs from 'fs'

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: async (baseConfig: any) => {
        console.log(baseConfig)
        fs.writeFileSync(path.join(__dirname, 'wrote-to-file'), 'OK')
        const cfg = await import('./webpack.config.js')

        return cfg.default
      },
    },
  },
  // These tests should run quickly / fail quickly,
  // since we intentionally causing error states for testing
  defaultCommandTimeout: 1000,
})
