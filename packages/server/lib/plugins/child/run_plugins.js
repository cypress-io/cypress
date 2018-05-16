const debug = require('debug')('cypress:server:plugins:child')
const Promise = require('bluebird')
const preprocessor = require('./preprocessor')
const util = require('../util')

const callbacks = {}

const invoke = (callbackId, args = []) => {
  const callback = callbacks[callbackId]
  if (!callback) {
    sendError(new Error(`No callback registered for callback id ${callbackId}`))
    return
  }

  return callback(...args)
}

const sendError = (ipc, err) => {
  ipc.send('error', util.serializeError(err))
}

let plugins

const load = (ipc, config, pluginsFile) => {
  debug('run plugins function')

  let callbackIdCount = 0
  const registrations = []

  // we track the register calls and then send them all at once
  // to the parent process
  const register = (event, fn) => {
    const callbackId = callbackIdCount++
    callbacks[callbackId] = fn

    debug('register event', event, 'with id', callbackId)

    registrations.push({
      event,
      callbackId,
    })
  }

  Promise
  .try(() => {
    return plugins(register, config)
  })
  .then((modifiedCfg) => {
    ipc.send('loaded', modifiedCfg, registrations)
  })
  .catch((err) => {
    ipc.send('load:error', 'PLUGINS_FUNCTION_ERROR', pluginsFile, err.stack)
  })
}

const execute = (ipc, event, ids, args = []) => {
  debug('execute plugin with id', ids.invocationId)

  switch (event) {
    case 'file:preprocessor':
      preprocessor.wrap(ipc, invoke, ids, args)
      return
    case 'before:browser:launch':
      util.wrapChildPromise(ipc, invoke, ids, args)
      return
    default:
      debug('unexpected execute message:', event, args)
      return
  }
}

module.exports = (ipc, pluginsFile) => {
  debug('pluginsFile:', pluginsFile)

  process.on('uncaughtException', (err) => {
    debug('uncaught exception:', util.serializeError(err))
    ipc.send('error', util.serializeError(err))
    return false
  })

  process.on('unhandledRejection', (event) => {
    const err = (event && event.reason) || event
    debug('unhandled rejection:', util.serializeError(err))
    ipc.send('error', util.serializeError(err))
    return false
  })

  try {
    debug('require pluginsFile')
    plugins = require(pluginsFile)
  } catch (err) {
    debug('failed to require pluginsFile:\n%s', err.stack)
    ipc.send('load:error', 'PLUGINS_FILE_ERROR', pluginsFile, err.stack)
    return
  }

  if (typeof plugins !== 'function') {
    debug('not a function')
    ipc.send('load:error', 'PLUGINS_DIDNT_EXPORT_FUNCTION', pluginsFile, plugins)
    return
  }

  ipc.on('load', (config) => {
    load(ipc, config, pluginsFile)
  })

  ipc.on('execute', (event, ids, args) => {
    execute(ipc, event, ids, args)
  })
}
