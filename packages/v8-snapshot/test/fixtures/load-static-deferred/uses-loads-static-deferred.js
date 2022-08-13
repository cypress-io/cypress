// This module would cause the static deferred module to be loaded and thus needs to be deferred
const isStringBuffer = require('./loads-static-deferred')
module.exports = isStringBuffer
