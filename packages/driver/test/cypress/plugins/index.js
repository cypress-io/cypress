require('@packages/ts/register')

const _ = require('lodash')
const path = require('path')
const fs = require('fs-extra')
const Promise = require('bluebird')
const webpack = require('@cypress/webpack-preprocessor')

const webpackOptions = require('@packages/runner/webpack.config.ts').default

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
