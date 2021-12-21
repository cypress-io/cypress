// @ts-check
// this module is responsible for loading the plugins file
// and running the exported function to register event handlers
// and executing any tasks that the plugin registers
const debugLib = require('debug')
const Promise = require('bluebird')
const _ = require('lodash')

const debug = debugLib(`cypress:lifecycle:child:RunPlugins:${process.pid}`)

const preprocessor = require('./preprocessor')
const devServer = require('./dev-server')
const resolve = require('../../util/resolve')
const browserLaunch = require('./browser_launch')
const util = require('../util')
const validateEvent = require('./validate_event')
const errors = require('../../errors')

const UNDEFINED_SERIALIZED = '__cypress_undefined__'

class RunPlugins {
  constructor (ipc, projectRoot, requiredFile) {
    this.ipc = ipc
    this.projectRoot = projectRoot
    this.requiredFile = requiredFile
    this.eventIdCount = 0
    this.registrations = []
    /**
     * @type {Record<string, {event: string, handler: Function}>}
     */
    this.registeredEventsById = {}
    this.registeredEventsByName = {}
  }

  invoke = (eventId, args = []) => {
    const event = this.registeredEventsById[eventId]

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

  load (initialConfig, setupNodeEvents) {
    debug('Loading the RunPlugins')

    // we track the register calls and then send them all at once
    // to the parent process
    const registerChildEvent = (event, handler) => {
      const { isValid, error } = validateEvent(event, handler, initialConfig)

      if (!isValid) {
        this.ipc.send('setupTestingType:error', 'PLUGINS_VALIDATION_ERROR', this.requiredFile, error.stack)

        return
      }

      if (event === 'dev-server:start' && this.registeredEventsByName[event]) {
        this.ipc.send('setupTestingType:error', 'SETUP_NODE_EVENTS_DO_NOT_SUPPORT_DEV_SERVER', this.requiredFile)

        return
      }

      if (event === 'task') {
        const existingEventId = this.registeredEventsByName[event]

        if (existingEventId) {
          handler = this.taskMerge(this.registeredEventsById[existingEventId].handler, handler)
          this.registeredEventsById[existingEventId] = { event, handler }
          debug('extend task events with id', existingEventId)

          return
        }
      }

      const eventId = this.eventIdCount++

      this.registeredEventsById[eventId] = { event, handler }
      this.registeredEventsByName[event] = eventId

      debug('register event', event, 'with id', eventId)

      this.registrations.push({
        event,
        eventId,
      })
    }

    // events used for parent/child communication
    registerChildEvent('_get:task:body', () => {})
    registerChildEvent('_get:task:keys', () => {})

    Promise
    .try(() => {
      debug('Calling setupNodeEvents')

      return setupNodeEvents(registerChildEvent, initialConfig)
    })
    .tap(() => {
      if (!this.registeredEventsByName['file:preprocessor']) {
        debug('register default preprocessor')
        registerChildEvent('file:preprocessor', this.getDefaultPreprocessor(initialConfig))
      }
    })
    .then((modifiedCfg) => {
      modifiedCfg = _.omit(modifiedCfg, 'projectRoot', 'configFile')
      debug('plugins file successfully loaded')
      this.ipc.send('setupTestingType:reply', {
        setupConfig: modifiedCfg,
        registrations: this.registrations,
        requires: util.nonNodeRequires(),
      })
    })
    .catch((err) => {
      debug('plugins file errored:', err && err.stack)
      this.ipc.send('setupTestingType:error', 'PLUGINS_FUNCTION_ERROR', err.stack)
    })
  }

  execute (event, ids, args = []) {
    debug(`execute plugin event: ${event} (%o)`, ids)

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
        return util.wrapChildPromise(this.ipc, this.invoke, ids, args)
      case 'task':
        return this.taskExecute(ids, args)
      case '_get:task:keys':
        return this.taskGetKeys(ids)
      case '_get:task:body':
        return this.taskGetBody(ids, args)
      case 'before:browser:launch':
        return browserLaunch.wrap(this.ipc, this.invoke, ids, args)
      default:
        debug('unexpected execute message:', event, args)

        return
    }
  }

  wrapChildPromise (invoke, ids, args = []) {
    return Promise.try(() => {
      return invoke(ids.eventId, args)
    })
    .then((value) => {
      // undefined is coerced into null when sent over ipc, but we need
      // to differentiate between them for 'task' event
      if (value === undefined) {
        value = UNDEFINED_SERIALIZED
      }

      return this.ipc.send(`promise:fulfilled:${ids.invocationId}`, null, value)
    }).catch((err) => {
      return this.ipc.send(`promise:fulfilled:${ids.invocationId}`, serializeError(err))
    })
  }

  taskGetBody (ids, args) {
    const [event] = args
    const taskEvent = _.find(this.registeredEventsById, { event: 'task' }).handler
    const invoke = () => {
      const fn = taskEvent[event]

      return _.isFunction(fn) ? fn.toString() : ''
    }

    util.wrapChildPromise(this.ipc, invoke, ids)
  }

  taskGetKeys (ids) {
    const taskEvent = _.find(this.registeredEventsById, { event: 'task' }).handler
    const invoke = () => _.keys(taskEvent)

    util.wrapChildPromise(this.ipc, invoke, ids)
  }

  taskMerge (target, events) {
    const duplicates = _.intersection(_.keys(target), _.keys(events))

    if (duplicates.length) {
      errors.warning('DUPLICATE_TASK_KEY', duplicates.join(', '))
    }

    return _.extend(target, events)
  }

  taskExecute (ids, args) {
    const task = args[0]
    let arg = args[1]

    // ipc converts undefined to null.
    // we're restoring it.
    if (arg && arg.__cypress_task_no_argument__) {
      arg = undefined
    }

    const invoke = (eventId, args = []) => {
      const handler = _.get(this.registeredEventsById, `${eventId}.handler.${task}`)

      if (_.isFunction(handler)) {
        return handler(...args)
      }

      return '__cypress_unhandled__'
    }

    util.wrapChildPromise(this.ipc, invoke, ids, [arg])
  }

  /**
   *
   * @param {Function} setupNodeEventsFn
   */
  runSetupNodeEvents (config, setupNodeEventsFn) {
    debug('project root:', this.projectRoot)
    if (!this.projectRoot) {
      throw new Error('Unexpected: projectRoot should be a string')
    }

    debug('passing config %o', config)
    this.load(config, setupNodeEventsFn)

    this.ipc.on('execute:plugins', (event, ids, args) => {
      this.execute(event, ids, args)
    })
  }
}

const serializeError = (err) => {
  return _.pick(err, 'name', 'message', 'stack', 'code', 'annotated', 'type')
}

exports.RunPlugins = RunPlugins
