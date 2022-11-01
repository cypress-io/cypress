// This module requires the statically deferred but doesn't use it during init
// Thus the resolution of the statically deferred is delayed, but this module is not deferred.
const isBuffer = require('./static-deferred')
function lateUse(x) {
  return isBuffer(x)
}

module.exports = lateUse
