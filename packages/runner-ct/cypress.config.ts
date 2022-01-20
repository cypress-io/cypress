import { defineConfig } from 'cypress'

export default defineConfig({
  video: true,
  env: {
    reactDevtools: false,
  },
  reporter: '../../node_modules/cypress-multi-reporters/index.js',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  component: {
    devServer (cypressConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      function injectStylesInlineForPercyInPlace (webpackConfig) {
        webpackConfig.module.rules = webpackConfig.module.rules.map((rule) => {
          if (rule?.use?.[0]?.loader.includes('mini-css-extract-plugin')) {
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

      const { default: webpackConfig } = require('./webpack.config.ts')

      injectStylesInlineForPercyInPlace(webpackConfig)

      return startDevServer({
        webpackConfig,
        options: cypressConfig,
      })
    },
  },
})
