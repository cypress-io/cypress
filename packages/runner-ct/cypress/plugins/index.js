/// <reference types="cypress" />
const odiff = require('odiff-bin')
const path = require('path')
const globby = require('globby')
const rimraf = require('rimraf')
const percyHealthCheck = require('@percy/cypress/task')
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
/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  on('task', percyHealthCheck)
  on('task', {
    async compareImages (screenshotName) {
      const expected = (await globby(path.join(__dirname, `../screenshots/**/*${screenshotName}.png`)))[0]
      const actual = path.join(__dirname, `../component/screenshots/${screenshotName}.png`)

      return odiff.compare(expected, actual)
    },

    clearScreenshots () {
      return new Promise((res, rej) => {
        rimraf(path.join(__dirname, `../screenshots/**/*screenshot.png`), {}, (err) => {
          if (err) {
            rej(err)
          }

          res('ok')
        })
      })
    },
  })

  on('dev-server:start', (options) => {
    /** @type {import('webpack').Configuration} */
    const { default: webpackConfig } = require(path.resolve(__dirname, '..', '..', 'webpack.config.ts'))

    injectStylesInlineForPercyInPlace(webpackConfig)

    return startDevServer({
      webpackConfig,
      options,
    })
  })

  return config
}
