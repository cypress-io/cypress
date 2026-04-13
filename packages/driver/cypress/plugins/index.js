// only required to read in webpack config, since it is .ts
require('@packages/ts/register')
require('./server')
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
  webpackOptions.plugins = webpackOptions.plugins.filter((plugin) => !plugin.evalDevToolPlugin)

  const babelLoader = webpackOptions.module.rules.find((rule) => {
    return rule.use.loader.includes('babel-loader')
  })

  // get rid of prismjs plugin. the driver doesn't need it
  babelLoader.use.options.plugins = babelLoader.use.options.plugins.filter((plugin) => {
    return !plugin[0].includes('babel-plugin-prismjs')
  })

  return webpackOptions
}
/**
 * @type {Cypress.PluginConfig}
 */
module.exports = async (on, config) => {
  const webpackOptions = await getWebpackOptions()

  on('file:preprocessor', wp({ webpackOptions }))

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
      const longText = Array.from({ length: 2000 }, () => {
        return Array.from({ length: 20 }, () => Math.random()).join(' ')
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
