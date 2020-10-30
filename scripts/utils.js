const minimist = require('minimist')
const la = require('lazy-ass')
const is = require('check-more-types')
const path = require('path')
const fs = require('fs')
const execa = require('execa')

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
  } else {
    console.log('NPM option "%s" is not a file', options.npm)
  }

  let binary = options.binary

  if (fs.existsSync(options.binary)) {
    console.log('loading binary url from', options.binary)
    binary = require(path.resolve(options.binary)).url
    la(is.url(binary), 'not an url', binary)
  } else {
    console.log('binary option "%s" is not a file', options.binary)
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

const shorten = (s) => {
  return s.substr(0, 7)
}

/**
 * Grabs the full commit SHA and its short version from CI environment variables
 */
const getShortCommit = () => {
  const sha =
    process.env.APPVEYOR_REPO_COMMIT ||
    process.env.CIRCLE_SHA1

  if (sha) {
    return {
      sha,
      short: shorten(sha),
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
    // looks like this
    // https://ci.appveyor.com/project/cypress-io/cypress/builds/25882716/job/7iv75s2vjt5w4usf
    return `${process.env.APPVEYOR_URL}/project/${
      process.env.APPVEYOR_ACCOUNT_NAME}/${process.env.APPVEYOR_PROJECT_SLUG
    }/builds/${process.env.APPVEYOR_BUILD_ID
    }/job/${process.env.APPVEYOR_JOB_ID}`
  }
}

const seconds = (s) => s * 1000
const minutes = (m) => m * 60 * 1000

const getCurrentBranch = async () => {
  const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'])

  return stdout
}

const getPackagePath = ({ location }) => path.join(location, 'package.json')

const readPackageJson = (pack) => JSON.parse(fs.readFileSync(getPackagePath(pack)))

const independentTagRegex = (name) => new RegExp(`^${name}-v(.+)`)

module.exports = {
  getNameAndBinary,
  getJustVersion,
  getShortCommit,
  getCIName,
  getCIBuildUrl,
  seconds,
  minutes,
  getCurrentBranch,
  getPackagePath,
  readPackageJson,
  independentTagRegex,
}
