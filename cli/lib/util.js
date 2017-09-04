const _ = require('lodash')
const path = require('path')
const isCi = require('is-ci')
const chalk = require('chalk')
const isInstalledGlobally = require('is-installed-globally')
const pkg = require(path.join(__dirname, '..', 'package.json'))
const logger = require('./logger')

const datesRe = /(\d+:\d+:\d+)/g

module.exports = {
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

  stripDates (str) {
    return str.replace(datesRe, 'xx:xx:xx')
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
