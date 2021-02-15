/// <reference types="cypress" />
const path = require('path')
const fs = require('fs')
const globby = require('globby')
const rimraf = require('rimraf')
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
    async compareImages (screenshotName) {
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

      const expected = (await globby(path.join(__dirname, `../screenshots/**/*${screenshotName}.png`)))[0]
      const actual = path.join(__dirname, `../component/screenshots/${screenshotName}.png`)

      return Promise.all([
        readAsync(expected),
        readAsync(actual),
        sizeOf(expected),
        sizeOf(actual),
      ])
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
