const semver = require('semver')

module.exports = {
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      if (!semver.valid(config.version)) {
        throw new Error('config.version is invalid')
      }

      return config
    },
  },
}
