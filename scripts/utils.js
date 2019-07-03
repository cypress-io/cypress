const minimist = require('minimist')
const la = require('lazy-ass')
const is = require('check-more-types')
const path = require('path')
const fs = require('fs')

/* eslint-disable no-console */

function getNameAndBinary (args = process.argv) {
  const options = minimist(args)

  la(is.unemptyString(options.npm), 'missing --npm option', options)
  la(is.unemptyString(options.binary), 'missing --binary option', options)

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
    binary
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

const shorten = s => {
  return s.substr(0, 7)
}

/**
 * Grabs the full commit SHA and its short version from CI environment variables
 */
const getShortCommit = () => {
  const sha =
    process.env.APPVEYOR_REPO_COMMIT ||
    process.env.CIRCLE_SHA1 ||
    process.env.BUILDKITE_COMMIT

  if (sha) {
    return {
      sha,
      short: shorten(sha)
    }
  }
}

/**
 * Returns CI name for know CIs
 */
const getCIName = () => {
  if (process.env.CIRCLECI) {
    return 'Circle'
  }

  if (process.env.APPVEYOR) {
    return 'AppVeyor'
  }
}

/**
 * Returns the current CI build url
 */
const getCIBuildUrl = () => {
  if (process.env.CIRCLECI) {
    // https://circleci.com/docs/2.0/env-vars/#built-in-environment-variables
    return process.env.CIRCLE_BUILD_URL
  }

  if (process.env.APPVEYOR) {
    // https://www.appveyor.com/docs/environment-variables/
    // there is no single url, but we can form one
    // TODO form AppVeyor build url
  }
}

module.exports = {
  getNameAndBinary,
  getJustVersion,
  getShortCommit,
  getCIName,
  getCIBuildUrl
}
