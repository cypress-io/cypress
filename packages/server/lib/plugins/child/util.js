const _ = require('lodash')
const Promise = require('bluebird')

const serializeError = (err) => _.pick(err, 'name', 'message', 'stack', 'code', 'annotated')

const wrapPromise = (ipc, invoke, ids, args = []) => {
  return Promise.try(() => {
    return invoke(ids.callbackId, args)
  })
  .then((value) => {
    ipc.send(`promise:fulfilled:${ids.invocationId}`, null, value)
  })
  .catch((err) => {
    ipc.send(`promise:fulfilled:${ids.invocationId}`, serializeError(err))
  })
}

module.exports = {
  serializeError,
  wrapPromise,
}
