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

class RunPlugins {
  constructor (ipc, projectRoot, requiredFile) {
    this.ipc = ipc
    this.projectRoot = projectRoot
    this.requiredFile = requiredFile
    this.eventIdCount = 0
    this.registrations = []
    this.ipc.on('execute:plugins', (event, ids, args) => {
      this.execute(event, ids, args)
    })
  }

  invoke (eventId, args = []) {
    const event = registeredEventsById[eventId]

    return event.handler(...args)
  }

  getDefaultPreprocessor (config) {
    const tsPath = resolve.typescript(config.projectRoot)
    const options = {
      typescript: tsPath,
    }

    debug('creating webpack preprocessor with options %o', options)

    const webpackPreprocessor = require('@cypress/webpack-batteries-included-preprocessor')

    return webpackPreprocessor(options)
  }

  load (config, setupNodeEvents) {
    debug('run plugins function')

    // we track the register calls and then send them all at once
    // to the parent process
    const register = (event, handler) => {
      const { isValid, error } = validateEvent(event, handler, config)

      if (!isValid) {
        this.ipc.send('load:error:plugins', 'PLUGINS_VALIDATION_ERROR', this.requiredFile, error.stack)

        return
      }

      if (event === 'dev-server:start' && registeredEventsByName[event]) {
        this.ipc.send('load:error:plugins', 'SETUP_NODE_EVENTS_DO_NOT_SUPPORT_DEV_SERVER', this.requiredFile)

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

      const eventId = this.eventIdCount++

      registeredEventsById[eventId] = { event, handler }
      registeredEventsByName[event] = eventId

      debug('register event', event, 'with id', eventId)

      this.registrations.push({
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
        register('file:preprocessor', this.getDefaultPreprocessor(config))
      }
    })
    .then((modifiedCfg) => {
      debug('plugins file successfully loaded')
      this.ipc.send('loaded:plugins', modifiedCfg, this.registrations)
    })
    .catch((err) => {
      debug('plugins file errored:', err && err.stack)
      this.ipc.send('load:error:plugins', 'PLUGINS_FUNCTION_ERROR', err.stack)
    })
  }

  execute (event, ids, args = []) {
    debug(`execute plugin event: ${event} (%o)`, ids)

    const wrapChildPromise = () => {
      util.wrapChildPromise(this.ipc, this.invoke, ids, args)
    }

    switch (event) {
      case 'dev-server:start':
        return devServer.wrap(this.ipc, this.invoke, ids, args)
      case 'file:preprocessor':
        return preprocessor.wrap(this.ipc, this.invoke, ids, args)
      case 'before:run':
      case 'before:spec':
      case 'after:run':
      case 'after:spec':
      case 'after:screenshot':
        return wrapChildPromise()
      case 'task':
        return task.wrap(this.ipc, registeredEventsById, ids, args)
      case '_get:task:keys':
        return task.getKeys(this.ipc, registeredEventsById, ids)
      case '_get:task:body':
        return task.getBody(this.ipc, registeredEventsById, ids, args)
      case 'before:browser:launch':
        return browserLaunch.wrap(this.ipc, this.invoke, ids, args)
      default:
        debug('unexpected execute message:', event, args)

        return
    }
  }

  runSetupNodeEvents (setupNodeEvents) {
    debug('project root:', this.projectRoot)
    if (!this.projectRoot) {
      throw new Error('Unexpected: projectRoot should be a string')
    }

    this.ipc.on('load:plugins', (config) => {
      debug('passing config %o', config)
      this.load(config, setupNodeEvents)
    })
  }

  __reset () {
    registeredEventsById = {}
    registeredEventsByName = {}
  }
}

module.exports = RunPlugins
