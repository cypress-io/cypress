import { defineConfig } from 'cypress'
import { devServer } from '@cypress/webpack-dev-server'

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
    viewportHeight: 399,
    devServer (cypressDevServerConfig) {
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

      return devServer(cypressDevServerConfig, { webpackConfig })
    },
  },
})
