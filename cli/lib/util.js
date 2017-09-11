const _ = require('lodash')
const R = require('ramda')
const path = require('path')
const isCi = require('is-ci')
const chalk = require('chalk')
const isInstalledGlobally = require('is-installed-globally')
const pkg = require(path.join(__dirname, '..', 'package.json'))
const logger = require('./logger')

const joinWithEq = (x, y) => `${x}=${y}`

// converts an object (single level) into
// key1=value1,key2=value2,...
const objectToString = (obj) =>
  R.zipWith(joinWithEq, R.keys(obj), R.values(obj)).join(',')

const normalizeEnv = (env) =>
  _.isPlainObject(env) ? objectToString(env) : env

function normalizeModuleOptions (options = {}) {
  return R.evolve({
    env: normalizeEnv,
  })(options)
}

const util = {
  normalizeModuleOptions,

  isCi () {
    return isCi
  },

  cwd () {
    return process.cwd()
  },

  pkgVersion () {
    return pkg.version
  },

  exit (code) {
    process.exit(code)
  },

  logErrorExit1 (err) {
    logger.error(err.message)

    process.exit(1)
  },

  titleize (...args) {
    // prepend first arg with space
    // and pad so that all messages line up
    args[0] = _.padEnd(` ${args[0]}`, 24)

    // get rid of any falsy values
    args = _.compact(args)

    return chalk.blue(...args)
  },

  calculateEta (percent, elapsed) {
    // returns the number of seconds remaining

    // if we're at 100 already just return 0
    if (percent === 100) {
      return 0
    }

    // take the percentage and divide by one
    // and multiple that against elapsed
    // subtracting what's already elapsed
    return elapsed * (1 / (percent / 100)) - elapsed
  },

  secsRemaining (eta) {
    // calculate the seconds reminaing with no decimal places
    return (_.isFinite(eta) ? (eta / 1000) : 0).toFixed(0)
  },

  setTaskTitle (task, title, renderer) {
    // only update the renderer title when not running in CI
    if (renderer === 'default') {
      task.title = title
    }
  },

  isInstalledGlobally () {
    return isInstalledGlobally
  },
}

module.exports = util
