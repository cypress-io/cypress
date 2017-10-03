const minimist = require('minimist')
const la = require('lazy-ass')
const is = require('check-more-types')
const path = require('path')

/* eslint-disable no-console */

function getNameAndBinary (args = process.argv) {
  const options = minimist(args)

  la(is.unemptyString(options.npm),
    'missing --npm option with package url', options)
  la(is.unemptyString(options.binary),
    'missing --binary option with binary url', options)

  console.log('loading NPM url from', options.npm)
  const npmUrl = require(path.resolve(options.npm)).url
  la(is.url(npmUrl), 'not an url', npmUrl)

  console.log('loading binary url from', options.binary)
  const binaryUrl = require(path.resolve(options.binary)).url
  la(is.url(binaryUrl), 'not an url', binaryUrl)

  return {
    npmUrl,
    binaryUrl,
  }
}

module.exports = {
  getNameAndBinary,
}
