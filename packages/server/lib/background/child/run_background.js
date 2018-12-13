const _ = require('lodash')
const debug = require('debug')('cypress:server:background:child')
const Promise = require('bluebird')

const driverEvents = require('./driver_events')
const serverEvents = require('./server_events')
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

let background

const load = (ipc, config, backgroundFile) => {
  debug('run background function')

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

  register('driver:event', () => {})
  register('server:event', () => {})

  Promise
  .try(() => {
    return background(register, config)
  })
  .then((modifiedCfg) => {
    ipc.send('loaded', modifiedCfg, registrations)
  })
  .catch((err) => {
    ipc.send('load:error', 'BACKGROUND_FUNCTION_ERROR', backgroundFile, err.stack)
  })
}

const execute = (ipc, event, ids, args = []) => {
  debug(`execute background event: ${event} (%o)`, ids)

  switch (event) {
    case 'screenshot':
      util.wrapChildPromise(ipc, invoke, ids, args)

      return
    case 'browser:filePreprocessor':
      preprocessor.wrap(ipc, invoke, ids, args)

      return
    case 'browser:launch':
      util.wrapChildPromise(ipc, invoke, ids, args)

      return
    case 'task':
      task.wrap(ipc, registeredEvents, ids, args)

      return
    case 'driver:event':
      driverEvents.execute(ipc, registeredEvents, ids, args)

      return
    case 'server:event':
      serverEvents.wrap(ipc, registeredEvents, ids, args)

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

module.exports = (process, ipc, backgroundFile) => {
  debug('backgroundFile:', backgroundFile)

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
    debug('require backgroundFile')
    background = require(backgroundFile)
  } catch (err) {
    debug('failed to require backgroundFile:\n%s', err.stack)
    ipc.send('load:error', 'BACKGROUND_FILE_ERROR', backgroundFile, err.stack)

    return
  }

  if (typeof background !== 'function') {
    debug('not a function')
    ipc.send('load:error', 'BACKGROUND_DIDNT_EXPORT_FUNCTION', backgroundFile, background)

    return
  }

  ipc.on('load', (config) => {
    load(ipc, config, backgroundFile)
  })

  ipc.on('execute', (event, ids, args) => {
    execute(ipc, event, ids, args)
  })
}
