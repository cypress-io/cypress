const semver = require('semver')

module.exports = (on, config) => {
  if (config.testingType !== 'e2e') {
    throw Error(`This is an e2e testing project. testingType should be 'e2e'. Received ${config.testingType}`)
  }

  if (!semver.valid(config.version)) {
    throw new Error('config.version is invalid')
  }
}
