const _ = require('lodash')
const log = require('debug')('cypress:server:plugins:child')
const preprocessor = require('./preprocessor')

const callbacks = {}

const invoke = (callbackId, args = []) => {
  const callback = callbacks[callbackId]
  if (!callback) {
    sendError(new Error(`No callback registered for callback id ${callbackId}`))
    return
  }

  return callback(...args)
}

const serializeError = (err) => _.pick(err, 'name', 'message', 'stack', 'code')

const sendError = (ipc, err) => {
  ipc.send('error', serializeError(err))
}

let plugins

const load = (ipc, config) => {
  log('run plugins function')

  let callbackIdCount = 0
  const registrations = []

  // we track the register calls and then send them all at once
  // to the parent process
  const register = (event, fn) => {
    const callbackId = callbackIdCount++
    callbacks[callbackId] = fn

    log('register event', event, 'with id', callbackId)

    registrations.push({
      event,
      callbackId,
    })
  }

  try {
    plugins(register, config)
    ipc.send('loaded', registrations)
  } catch (err) {
    ipc.send('load:error', 'PLUGINS_FUNCTION_ERROR', serializeError(err))
  }
}

const execute = (ipc, event, ids, args = []) => {
  log('execute plugin with id', ids.invocationId)

  switch (event) {
    case 'file:preprocessor':
      preprocessor.wrap(ipc, invoke, ids, args)
      return
    default:
      log('unexpected execute message:', event, args)
      return
  }
}

module.exports = (ipc, pluginsFile) => {
  log('pluginsFile:', pluginsFile)

  try {
    log('require pluginsFile')
    plugins = require(pluginsFile)
  } catch (err) {
    log('failed to require pluginsFile:\n%s', err.stack)
    ipc.send('load:error', 'PLUGINS_FILE_ERROR', serializeError(err))
    return
  }

  if (typeof plugins !== 'function') {
    log('not a function')
    ipc.send('load:error', 'PLUGINS_DIDNT_EXPORT_FUNCTION', pluginsFile, plugins)
    return
  }

  ipc.on('load', (config) => {
    load(ipc, config)
  })

  ipc.on('execute', (event, ids, args) => {
    execute(ipc, event, ids, args)
  })

  // TODO: listen to uncaughtException, maybe unhandleRejection and send error to parent process
}
