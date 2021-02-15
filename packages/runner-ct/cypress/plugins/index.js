/// <reference types="cypress" />
const path = require('path')
const fs = require('fs')
const percyHealthCheck = require('@percy/cypress/task')
const { startDevServer } = require('@cypress/webpack-dev-server')
const Promise = require('bluebird')
let sizeOf = require('image-size')

sizeOf = Promise.promisify(sizeOf)

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
    compareImages (screenshotName) {
      const readAsync = (p) => {
        return new Promise((res, rej) => {
          fs.readFile(p, {}, (err, data) => {
            if (err) {
              rej(err)
            }

            res(data)
          })
        })
      }

      return Promise.all([
        readAsync(path.resolve(__dirname, '..', 'screenshots', 'All Specs', `${screenshotName}.png`)),
        readAsync(path.resolve(__dirname, '..', 'component', 'screenshots', `${screenshotName}.png`)),
        sizeOf((path.resolve(__dirname, '..', 'screenshots', 'All Specs', `${screenshotName}.png`))),
        sizeOf((path.resolve(__dirname, '..', 'component', 'screenshots', `${screenshotName}.png`))),
      ])
    },

    clearScreenshots () {
      return new Promise((res, rej) => {
        fs.rmdir(path.resolve(__dirname, '..', 'screenshots'), { recursive: true }, (err) => {
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
