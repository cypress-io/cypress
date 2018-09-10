const _ = require('lodash')
const debug = require('debug')('cypress:server:plugins:child')
const Promise = require('bluebird')
const preprocessor = require('./preprocessor')
const task = require('./task')
const util = require('../util')

const registeredEvents = {}

const invoke = (eventId, args = []) => {
  const event = registeredEvents[eventId]
  if (!event) {
    sendError(new Error(`No handler registered for event id ${eventId}`))
    return
  }

  return event.handler(...args)
}

const sendError = (ipc, err) => {
  ipc.send('error', util.serializeError(err))
}

let plugins

const load = (ipc, config, pluginsFile) => {
  debug('run plugins function')

  let eventIdCount = 0
  const registrations = []

  // we track the register calls and then send them all at once
  // to the parent process
  const register = (event, handler) => {
    if (event === 'task') {
      const existingEventId = _.findKey(registeredEvents, { event: 'task' })
      if (existingEventId) {
        handler = task.merge(registeredEvents[existingEventId].handler, handler)
        registeredEvents[existingEventId] = { event, handler }
        debug('extend task events with id', existingEventId)
        return
      }
    }

    const eventId = eventIdCount++
    registeredEvents[eventId] = { event, handler }

    debug('register event', event, 'with id', eventId)

    registrations.push({
      event,
      eventId,
    })
  }

  // events used for parent/child communication
  register('_get:task:body', () => {})
  register('_get:task:keys', () => {})

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
  debug(`execute plugin event: ${event} (%o)`, ids)

  switch (event) {
    case 'after:screenshot':
      util.wrapChildPromise(ipc, invoke, ids, args)
      return
    case 'file:preprocessor':
      preprocessor.wrap(ipc, invoke, ids, args)
      return
    case 'before:browser:launch':
      util.wrapChildPromise(ipc, invoke, ids, args)
      return
    case 'task':
      task.wrap(ipc, registeredEvents, ids, args)
      return
    case '_get:task:keys':
      task.getKeys(ipc, registeredEvents, ids)
      return
    case '_get:task:body':
      task.getBody(ipc, registeredEvents, ids, args)
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
