import { defineConfig } from 'cypress'

export default defineConfig({
  testFiles: '**/*spec.{ts,tsx}',
  video: true,
  env: {
    reactDevtools: false,
  },
  reporter: '../../node_modules/cypress-multi-reporters/index.js',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  component: {
    testFiles: '**/*spec.{ts,tsx}',
    setupNodeEvents (on, config) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      function injectStylesInlineForPercyInPlace (webpackConfig) {
        webpackConfig.module.rules = webpackConfig.module.rules.map((rule) => {
          if (rule?.use[0]?.loader.includes('mini-css-extract-plugin')) {
            return {
              ...rule,
              use: [{
                loader: 'style-loader',
              }],
            }
          }

          return rule
        })
      }

      on('dev-server:start', (options) => {
        const { default: webpackConfig } = require('./webpack.config.ts')

        injectStylesInlineForPercyInPlace(webpackConfig)

        return startDevServer({
          webpackConfig,
          options,
        })
      })

      return config
    },
  },
})
