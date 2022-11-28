// only required to read in webpack config, since it is .ts
require('@packages/ts/register')
require('./server')
const _ = require('lodash')
const path = require('path')
const fs = require('fs-extra')
const Promise = require('bluebird')
const wp = require('@cypress/webpack-preprocessor')
const Jimp = require('jimp')

process.env.NO_LIVERELOAD = '1'
const [webpackOptions] = require('@packages/runner/webpack.config.ts').default

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

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  on('file:preprocessor', wp({ webpackOptions }))

  on('task', {
    'return:arg' (arg) {
      return arg
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
    'create:long:file' () {
      const filePath = path.join(__dirname, '..', '_test-output', 'longtext.txt')
      const longText = _.times(2000).map(() => {
        return _.times(20).map(() => Math.random()).join(' ')
      }).join('\n\n')

      fs.outputFileSync(filePath, longText)

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
