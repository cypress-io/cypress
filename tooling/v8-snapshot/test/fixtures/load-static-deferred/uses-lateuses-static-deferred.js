// This module delays calling a function that needs to be deferred and thus should not be deferred
const isBuffer = require('./lateuses-static-deferred')
module.exports = function areBuffer(x, y) {
  return isBuffer(x) && isBuffer(y)
}
