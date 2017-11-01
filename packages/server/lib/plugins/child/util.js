const _ = require('lodash')
const Promise = require('bluebird')

const wrapPromise = (ipc, invoke, ids, args = []) => {
  return Promise.try(() => {
    return invoke(ids.callbackId, args)
  })
  .then((value) => {
    ipc.send(`promise:fulfilled:${ids.invocationId}`, null, value)
  })
  .catch((err) => {
    ipc.send(`promise:fulfilled:${ids.invocationId}`, _.pick(err, 'name', 'message', 'stack', 'code'))
  })
}

module.exports = {
  wrapPromise,
}
