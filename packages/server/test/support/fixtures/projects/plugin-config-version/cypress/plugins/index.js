const semver = require('semver')

module.exports = (on, config, mode) => {
  if (mode !== 'e2e') {
    throw Error('This is an e2e project. mode should be `e2e`.')
  }

  if (!semver.valid(config.version)) {
    throw new Error('config.version is invalid')
  }
}
