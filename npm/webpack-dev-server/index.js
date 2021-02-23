const { validatePeerDependencies } = require('./dist/errors')

validatePeerDependencies()

module.exports = require('./dist')
