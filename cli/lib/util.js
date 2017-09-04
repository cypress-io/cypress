const _ = require('lodash')
const path = require('path')
const isInstalledGlobally = require('is-installed-globally')
const pkg = require(path.join(__dirname, '..', '..', 'package.json'))
const logger = require('./logger')

module.exports = {
  cwd () {
    return process.cwd()
  },

  pkgVersion () {
    return pkg.version
  },

  exit (code) {
    process.exit(code)
  },

  exit1 () {
    process.exit(1)
  },

  logErrorExit1 (err) {
    logger.error(err.message)

    process.exit(1)
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

  isInstalledGlobally () {
    return isInstalledGlobally
  },
}
