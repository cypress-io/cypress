// this module is responsible for loading the plugins file
// and running the exported function to register event handlers
// and executing any tasks that the plugin registers
const debug = require('debug')('cypress:server:plugins:child')
const Promise = require('bluebird')

const errors = require('../../errors')
const preprocessor = require('./preprocessor')
const resolve = require('../../util/resolve')
const task = require('./task')
const util = require('../util')
const validateEvent = require('./validate_event')
const { registerTsNode } = require('../../util/ts-node')

const ARRAY_METHODS = ['concat', 'push', 'unshift', 'slice', 'pop', 'shift', 'slice', 'splice', 'filter', 'map', 'forEach', 'reduce', 'reverse', 'splice', 'includes']

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

let plugins

const load = (ipc, config, pluginsFile) => {
  debug('run plugins function')

  let eventIdCount = 0
  const registrations = []

  // we track the register calls and then send them all at once
  // to the parent process
  const register = (event, handler) => {
    const { isValid, error } = validateEvent(event, handler)

    if (!isValid) {
      ipc.send('load:error', 'PLUGINS_VALIDATION_ERROR', pluginsFile, error.stack)

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

    return plugins(register, config)
  })
  .tap(() => {
    if (!registeredEventsByName['file:preprocessor']) {
      debug('register default preprocessor')
      register('file:preprocessor', getDefaultPreprocessor(config))
    }
  })
  .then((modifiedCfg) => {
    debug('plugins file successfully loaded')
    ipc.send('loaded', modifiedCfg, registrations)
  })
  .catch((err) => {
    debug('plugins file errored:', err && err.stack)
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
    case 'before:browser:launch': {
      // TODO: remove in next breaking release
      // This will send a warning message when a deprecated API is used
      // define array-like functions on this object so we can warn about using deprecated array API
      // while still fufiling desired behavior
      const [, launchOptions] = args

      let hasEmittedWarning = false

      ARRAY_METHODS.forEach((name) => {
        const boundFn = launchOptions.args[name].bind(launchOptions.args)

        launchOptions[name] = function () {
          if (hasEmittedWarning) return

          hasEmittedWarning = true

          const warning = errors.get('DEPRECATED_BEFORE_BROWSER_LAUNCH_ARGS')

          ipc.send('warning', util.serializeError(warning))

          // eslint-disable-next-line prefer-rest-params
          return boundFn.apply(this, arguments)
        }
      })

      Object.defineProperty(launchOptions, 'length', {
        get () {
          return this.args.length
        },
      })

      launchOptions[Symbol.iterator] = launchOptions.args[Symbol.iterator].bind(launchOptions.args)

      util.wrapChildPromise(ipc, invoke, ids, args)

      return
    }

    case 'task':
      task.wrap(ipc, registeredEventsById, ids, args)

      return
    case '_get:task:keys':
      task.getKeys(ipc, registeredEventsById, ids)

      return
    case '_get:task:body':
      task.getBody(ipc, registeredEventsById, ids, args)

      return
    default:
      debug('unexpected execute message:', event, args)

      return
  }
}

let tsRegistered = false

const runPlugins = (ipc, pluginsFile, projectRoot) => {
  debug('pluginsFile:', pluginsFile)
  debug('project root:', projectRoot)
  if (!projectRoot) {
    throw new Error('Unexpected: projectRoot should be a string')
  }

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

  if (!tsRegistered) {
    registerTsNode(projectRoot, pluginsFile)

    // ensure typescript is only registered once
    tsRegistered = true
  }

  try {
    debug('require pluginsFile')
    plugins = require(pluginsFile)

    // Handle export default () => {}
    if (plugins && typeof plugins.default === 'function') {
      plugins = plugins.default
    }
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
    debug('plugins load file "%s"', pluginsFile)
    debug('passing config %o', config)
    load(ipc, config, pluginsFile)
  })

  ipc.on('execute', (event, ids, args) => {
    execute(ipc, event, ids, args)
  })
}

// for testing purposes
runPlugins.__reset = () => {
  tsRegistered = false
  registeredEventsById = {}
  registeredEventsByName = {}
}

module.exports = runPlugins
