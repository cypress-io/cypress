const minimist = require('minimist')
const la = require('lazy-ass')
const is = require('check-more-types')
const path = require('path')
const fs = require('fs')

/* eslint-disable no-console */

function getNameAndBinary (args = process.argv) {
  const options = minimist(args)

  la(is.unemptyString(options.npm),
    'missing --npm option with package url', options)
  la(is.unemptyString(options.binary),
    'missing --binary option with binary url', options)

  let npmUrlOrVersion = options.npm
  if (fs.existsSync(options.npm)) {
    console.log('loading NPM url from', options.npm)
    npmUrlOrVersion = require(path.resolve(options.npm)).url
    la(is.url(npmUrlOrVersion), 'not an url', npmUrlOrVersion)
  }

  let binaryVersionOrUrl = options.binary
  if (fs.existsSync(options.binary)) {
    console.log('loading binary url from', options.binary)
    binaryVersionOrUrl = require(path.resolve(options.binary)).url
    la(is.url(binaryVersionOrUrl), 'not an url', binaryVersionOrUrl)
  }

  return {
    npmUrl: npmUrlOrVersion,
    binaryUrl: binaryVersionOrUrl,
  }
}

module.exports = {
  getNameAndBinary,
}
