// This module uses the statically deferred module during initialization and thus is deferred as well
const isBuffer = require('./static-deferred')
module.exports = isBuffer('not a buffer')
