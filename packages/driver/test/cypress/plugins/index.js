// only required to read in webpack config, since it is .ts
require('@packages/ts/register')

const _ = require('lodash')
const path = require('path')
const fs = require('fs-extra')
const Promise = require('bluebird')
const webpack = require('@cypress/webpack-preprocessor')

process.env.NO_LIVERELOAD = '1'
const webpackOptions = require('@packages/runner/webpack.config.ts').default

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
module.exports = (on) => {
  on('file:preprocessor', webpack({ webpackOptions }))

  on('task', {
    'return:arg' (arg) {
      return arg
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
  })
}
