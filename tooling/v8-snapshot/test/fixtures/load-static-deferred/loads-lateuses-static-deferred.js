// This module calls a function that needs to be deferred and thus should be deferred
const isBuffer = require('./lateuses-static-deferred')
module.exports = isBuffer('not a buffer')
