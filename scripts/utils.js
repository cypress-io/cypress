const minimist = require('minimist')
const la = require('lazy-ass')
const is = require('check-more-types')
const path = require('path')
const fs = require('fs')

/* eslint-disable no-console */

function getNameAndBinary (args = process.argv) {
  const options = minimist(args)

  la(is.unemptyString(options.npm),
    'missing --npm option', options)

  la(is.unemptyString(options.binary),
    'missing --binary option', options)

  let npm = options.npm

  if (fs.existsSync(options.npm)) {
    console.log('loading NPM url from', options.npm)
    npm = require(path.resolve(options.npm)).url
    la(is.url(npm), 'not an url', npm)
  }

  let binary = options.binary

  if (fs.existsSync(options.binary)) {
    console.log('loading binary url from', options.binary)
    binary = require(path.resolve(options.binary)).url
    la(is.url(binary), 'not an url', binary)
  }

  return {
    npm,
    binary,
  }
}

function getJustVersion (npmNameOrUrl) {
  la(is.unemptyString(npmNameOrUrl), 'missing NPM string', npmNameOrUrl)

  if (npmNameOrUrl.startsWith('cypress')) {
    return npmNameOrUrl
  }

  if (is.url(npmNameOrUrl)) {
    // try finding semver in the url
    // https://something/0.20.3/something...
    const re = /\/(\d+\.\d+\.\d+(-\w+)?)\//
    const matches = re.exec(npmNameOrUrl)

    if (matches) {
      return matches[1]
    }
  }

  return npmNameOrUrl
}

module.exports = {
  getNameAndBinary,
  getJustVersion,
}
