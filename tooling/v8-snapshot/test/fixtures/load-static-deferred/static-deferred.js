// Is deferred via static analysis since it probes `Buffer`

var isBuffer =
  typeof Buffer !== 'undefined'
    ? Buffer.isBuffer
    : function stubFalse() {
        return false
      }

module.exports = isBuffer
