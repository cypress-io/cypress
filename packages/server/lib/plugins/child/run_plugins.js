// this module is responsible for loading the plugins file
// and running the exported function to register event handlers
// and executing any tasks that the plugin registers
const debug = require('debug')('cypress:server:plugins:child')
const Promise = require('bluebird')

const preprocessor = require('./preprocessor')
const devServer = require('./dev-server')
const resolve = require('../../util/resolve')
const browserLaunch = require('./browser_launch')
const task = require('./task')
const util = require('../util')
const validateEvent = require('./validate_event')

let registeredEventsById = {}
let registeredEventsByName = {}

const invoke = (eventId, args = []) => {
  const event = registeredEventsById[eventId]

  return event.handler(...args)
}

const getDefaultPreprocessor = function (config) {
  const tsPath = resolve.typescript(config.projectRoot)
  const options = {
    typescript: tsPath,
  }

  debug('creating webpack preprocessor with options %o', options)

  const webpackPreprocessor = require('@cypress/webpack-batteries-included-preprocessor')

  return webpackPreprocessor(options)
}

let setupNodeEvents

const load = (ipc, config, requiredFile) => {
  debug('run plugins function')

  let eventIdCount = 0
  const registrations = []

  // we track the register calls and then send them all at once
  // to the parent process
  const register = (event, handler) => {
    const { isValid, error } = validateEvent(event, handler, config)

    if (!isValid) {
      ipc.send('load:error:plugins', 'PLUGINS_VALIDATION_ERROR', requiredFile, error.stack)

      return
    }

    if (event === 'task') {
      const existingEventId = registeredEventsByName[event]

      if (existingEventId) {
        handler = task.merge(registeredEventsById[existingEventId].handler, handler)
        registeredEventsById[existingEventId] = { event, handler }
        debug('extend task events with id', existingEventId)

        return
      }
    }

    const eventId = eventIdCount++

    registeredEventsById[eventId] = { event, handler }
    registeredEventsByName[event] = eventId

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
    debug('run plugins function')

    return setupNodeEvents(register, config)
  })
  .tap(() => {
    if (!registeredEventsByName['file:preprocessor']) {
      debug('register default preprocessor')
      register('file:preprocessor', getDefaultPreprocessor(config))
    }
  })
  .then((modifiedCfg) => {
    debug('plugins file successfully loaded')
    ipc.send('loaded:plugins', modifiedCfg, registrations)
  })
  .catch((err) => {
    debug('plugins file errored:', err && err.stack)
    ipc.send('load:error:plugins', 'PLUGINS_FUNCTION_ERROR', err.stack)
  })
}

const execute = (ipc, event, ids, args = []) => {
  debug(`execute plugin event: ${event} (%o)`, ids)

  const wrapChildPromise = () => {
    util.wrapChildPromise(ipc, invoke, ids, args)
  }

  switch (event) {
    case 'dev-server:start':
      return devServer.wrap(ipc, invoke, ids, args)
    case 'file:preprocessor':
      return preprocessor.wrap(ipc, invoke, ids, args)
    case 'before:run':
    case 'before:spec':
    case 'after:run':
    case 'after:spec':
    case 'after:screenshot':
      return wrapChildPromise()
    case 'task':
      return task.wrap(ipc, registeredEventsById, ids, args)
    case '_get:task:keys':
      return task.getKeys(ipc, registeredEventsById, ids)
    case '_get:task:body':
      return task.getBody(ipc, registeredEventsById, ids, args)
    case 'before:browser:launch':
      return browserLaunch.wrap(ipc, invoke, ids, args)
    default:
      debug('unexpected execute message:', event, args)

      return
  }
}

const runSetupNodeEvents = (ipc, _setupNodeEvents, projectRoot, requiredFile) => {
  if (_setupNodeEvents && typeof _setupNodeEvents !== 'function') {
    ipc.send('load:error:plugins', 'SETUP_NODE_EVENTS_IS_NOT_FUNCTION', requiredFile, _setupNodeEvents)
  }

  // Set a default handler to successfully register `file:preprocessor`
  setupNodeEvents = _setupNodeEvents ?? ((on, config) => {})

  debug('project root:', projectRoot)
  if (!projectRoot) {
    throw new Error('Unexpected: projectRoot should be a string')
  }

  ipc.on('load:plugins', (config) => {
    debug('passing config %o', config)
    load(ipc, config, requiredFile)
  })

  ipc.on('execute:plugins', (event, ids, args) => {
    execute(ipc, event, ids, args)
  })
}

// for testing purposes
runSetupNodeEvents.__reset = () => {
  registeredEventsById = {}
  registeredEventsByName = {}
}

module.exports = runSetupNodeEvents
