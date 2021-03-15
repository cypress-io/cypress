const semver = require('semver')

module.exports = (on, config) => {
  if (!semver.valid(config.version)) {
    throw new Error('config.version is invalid')
  }
}
