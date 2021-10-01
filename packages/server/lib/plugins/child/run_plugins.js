// this module is responsible for loading the plugins file
// and running the exported function to register event handlers
// and executing any tasks that the plugin registers
const debug = require('debug')('cypress:server:plugins:child')
const Promise = require('bluebird')

const preprocessor = require('./preprocessor')
const devServer = require('./dev-server')
const resolve = require('../../util/resolve')
const tsNodeUtil = require('../../util/ts_node')
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

let plugins
let devServerFunction
let devServerOptions

const load = (ipc, config, pluginsFile) => {
  debug('run plugins function')

  let eventIdCount = 0
  const registrations = []

  // we track the register calls and then send them all at once
  // to the parent process
  const register = (event, handler) => {
    const { isValid, error } = validateEvent(event, handler, config)

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

    if (devServerFunction) {
      register('dev-server:start', (cypressDevServerOptions) => devServerFunction(cypressDevServerOptions, devServerOptions))
    }

    if (plugins) {
      return plugins(register, config)
    }

    return
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

function interopRequire (pluginsFile) {
  const exp = require(pluginsFile)

  return exp && exp.default ? exp.default : exp
}

/**
 * the plugins function can be either at the top level
 * in a pluginsFile or in a non-dedicated cypress.config.js file
 * This functions normalizes where the function is and runs it.
 *
 * @param {string} pluginsFile absolute path of the targeted file conatining the plugins function
 * @param {string} functionName path to the function in the exported object like `"e2e.plugins"`
 * @returns the plugins function found
 */
function getPluginsFunction (resolvedExport, testingType) {
  if (testingType) {
    if (resolvedExport[testingType]) {
      return resolvedExport[testingType].setupNodeEvents
    }
  }

  return resolvedExport
}

let tsRegistered = false

const runPlugins = (ipc, pluginsFile, projectRoot, testingType) => {
  debug('plugins file:', pluginsFile)
  debug('testingType:', testingType)
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
    tsNodeUtil.register(projectRoot, pluginsFile)

    // ensure typescript is only registered once
    tsRegistered = true
  }

  try {
    debug('require pluginsFile "%s"', pluginsFile)
    const pluginsObject = interopRequire(pluginsFile)

    plugins = getPluginsFunction(pluginsObject, testingType)

    if (testingType === 'component' && pluginsObject.component) {
      devServerFunction = pluginsObject.component.devServer
      devServerOptions = pluginsObject.component.devServerOptions
    }

    debug('plugins %O', plugins)
    debug('devServerFunction %s', devServerFunction.toString())
    debug('devServerOptions %O', devServerOptions)
  } catch (err) {
    debug('failed to require pluginsFile:\n%s', err.stack)
    ipc.send('load:error', 'PLUGINS_FILE_ERROR', pluginsFile, err.stack)

    return
  }

  if (typeof plugins !== 'function' && !devServerFunction) {
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
