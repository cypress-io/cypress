// only required to read in webpack config, since it is .ts
require('@packages/ts/register')
require('./server')
const _ = require('lodash')
const path = require('path')
const fs = require('fs-extra')
const Promise = require('bluebird')
const wp = require('@cypress/webpack-preprocessor')
const Jimp = require('jimp')
const webpackConfig = require('@packages/runner/webpack.config.ts')

async function getWebpackOptions () {
  const opts = await webpackConfig.default()

  const webpackOptions = opts[0]

  // set mode to development which overrides
  // the 'none' value of the base webpack config
  // https://webpack.js.org/configuration/mode/
  webpackOptions.mode = 'development'

  // remove the evalDevToolPlugin which comes from the base
  // webpack config - otherwise we won't get code frames
  webpackOptions.plugins = _.reject(webpackOptions.plugins, { evalDevToolPlugin: true })

  const babelLoader = _.find(webpackOptions.module.rules, (rule) => {
    return _.includes(rule.use.loader, 'babel-loader')
  })

  // get rid of prismjs plugin. the driver doesn't need it
  babelLoader.use.options.plugins = _.reject(babelLoader.use.options.plugins, (plugin) => {
    return _.includes(plugin[0], 'babel-plugin-prismjs')
  })

  return webpackOptions
}
/**
 * @type {Cypress.PluginConfig}
 */
module.exports = async (on, config) => {
  const webpackOptions = await getWebpackOptions()

  on('file:preprocessor', wp({ webpackOptions }))

  on('before:browser:launch', (browser, launchOptions) => {
    if (browser.family === 'firefox') {
      // set testing_localhost_is_secure_when_hijacked to true so localhost will be considered a secure context
      launchOptions.preferences['network.proxy.testing_localhost_is_secure_when_hijacked'] = true
    }

    return launchOptions
  })

  on('task', {
    'return:arg' (arg) {
      return arg
    },
    'return:foo' () {
      return 'foo'
    },
    'return:bar' () {
      return 'bar'
    },
    'return:baz' () {
      return 'baz'
    },
    'cypress:env' () {
      return process.env['CYPRESS']
    },
    'arg:is:undefined' (arg) {
      if (arg === undefined) {
        return 'arg was undefined'
      }

      throw new Error(`Expected arg to be undefined, but it was ${arg}`)
    },
    'wait' () {
      return Promise.delay(2000)
    },
    async 'create:long:file' () {
      const filePath = path.join(__dirname, '..', '_test-output', 'longtext.txt')
      const longText = _.times(2000).map(() => {
        return _.times(20).map(() => Math.random()).join(' ')
      }).join('\n\n')

      await fs.outputFile(filePath, longText)

      return null
    },
    'check:screenshot:size' ({ filePath, width, height, devicePixelRatio }) {
      return Jimp.read(filePath)
      .then((image) => {
        width = width * devicePixelRatio
        height = height * devicePixelRatio

        if (image.bitmap.width !== width || image.bitmap.height !== height) {
          throw new Error(`Screenshot does not match dimensions! Expected: ${width} x ${height} but got ${image.bitmap.width} x ${image.bitmap.height}`)
        }

        return null
      })
    },
  })

  return config
}
