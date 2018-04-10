const _ = require('lodash')
const util = require('../util')

const wrap = (ipc, callbacks, ids, args) => {
  const event = args[0]
  const arg = args[1]

  const invoke = (callbackId, args = []) => {
    const callback = callbacks[callbackId][event]
    if (_.isFunction(callback)) {
      return callback(...args)
    } else {
      return '__cypress_unhandled__'
    }
  }

  util.wrapChildPromise(ipc, invoke, ids, [arg])
}

module.exports = {
  wrap,
}
