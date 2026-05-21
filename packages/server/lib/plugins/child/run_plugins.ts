// this module is responsible for loading the plugins file
// and running the exported function to register event handlers
// and executing any tasks that the plugin registers
import debugLib from 'debug'
import Promise from 'bluebird'
import _ from 'lodash'
import { wrap as wrapPreprocessor } from './preprocessor'
import { wrap as wrapDevServer } from './dev-server'
import { typescript as resolveTypescript } from '../../util/resolve'
import { wrapBefore as wrapBeforeBrowserLaunch } from './browser_launch'
import { nonNodeRequires, serializeError, wrapChildPromise } from '../util'
import { validateEvent } from './validate_event'
import { processCallback as processCrossOriginCallback } from './cross_origin'
import type {
  PluginChildIpc,
  PluginExecuteEvent,
  PluginInvokeIds,
  PluginRegistration,
  RegisteredPluginEvent,
  RegisteredPluginHandler,
  SetupNodeEventsFn,
  TaskEventHandler,
} from './types'

const debug = debugLib(`cypress:lifecycle:child:RunPlugins:${process.pid}`)

export class RunPlugins {
  private ipc: PluginChildIpc
  private projectRoot: string
  private requiredFile: string
  private eventIdCount = 0
  private registrations: PluginRegistration[] = []
  private registeredEventsById: Record<number, RegisteredPluginEvent> = {}
  private registeredEventsByName: Record<string, number> = {}

  constructor (ipc: PluginChildIpc, projectRoot: string, requiredFile: string) {
    this.ipc = ipc
    this.projectRoot = projectRoot
    this.requiredFile = requiredFile
  }

  /**
   * This is the only publicly-used method of this class
   */
  runSetupNodeEvents (config: Cypress.PluginConfigOptions, setupNodeEventsFn: SetupNodeEventsFn) {
    debug('project root:', this.projectRoot)
    if (!this.projectRoot) {
      throw new Error('Unexpected: projectRoot should be a string')
    }

    debug('passing config %o', config)

    this.ipc.on('execute:plugins', (event: PluginExecuteEvent, ids: PluginInvokeIds, args: any[]) => {
      this.execute(event, ids, args)
    })

    return this.load(config, setupNodeEventsFn)
  }

  load (initialConfig: Cypress.PluginConfigOptions, setupNodeEvents: SetupNodeEventsFn) {
    debug('Loading the RunPlugins')

    // we track the register calls and then send them all at once
    // to the parent process
    const registerChildEvent = (event: string, handler: RegisteredPluginHandler) => {
      const validation = validateEvent(event, handler, initialConfig)

      if (!validation.isValid) {
        const { userEvents, error } = validation
        const err = userEvents
          ? require('@packages/errors').getError('SETUP_NODE_EVENTS_INVALID_EVENT_NAME_ERROR', this.requiredFile, event, userEvents, error)
          : require('@packages/errors').getError('CONFIG_FILE_SETUP_NODE_EVENTS_ERROR', this.requiredFile, initialConfig.testingType, error)

        this.ipc.send('setupTestingType:error', serializeError(err))

        return
      }

      if (event === 'task') {
        const existingEventId = this.registeredEventsByName[event]

        if (existingEventId !== undefined) {
          handler = this.taskMerge(
            this.registeredEventsById[existingEventId].handler as TaskEventHandler,
            handler as TaskEventHandler,
          )

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
    registerChildEvent('_process:cross:origin:callback', processCrossOriginCallback)

    return Promise
    .try(() => {
      debug('Calling setupNodeEvents')

      return setupNodeEvents(registerChildEvent, initialConfig)
    })
    .tap(() => {
      if (!this.registeredEventsByName['file:preprocessor']) {
        debug('register default preprocessor')
        registerChildEvent('file:preprocessor', this._getDefaultPreprocessor(initialConfig))
      } else {
        const handler = this.registeredEventsById[this.registeredEventsByName['file:preprocessor']].handler

        this.ipc.send('file:preprocessor:overridden', { handlerText: handler.toString() })
      }
    })
    .then((modifiedCfg) => {
      debug('plugins file successfully loaded')

      this.ipc.send('setupTestingType:reply', {
        setupConfig: modifiedCfg,
        registrations: this.registrations,
        requires: nonNodeRequires(),
      })
    })
    .catch((err) => {
      debug('plugins file errored:', err && err.stack)
      this.ipc.send('setupTestingType:error', serializeError(require('@packages/errors').getError(
        'CONFIG_FILE_SETUP_NODE_EVENTS_ERROR',
        this.requiredFile,
        initialConfig.testingType,
        err,
      )))
    })
  }

  execute (event: PluginExecuteEvent, ids: PluginInvokeIds, args: any[] = []) {
    debug(`execute plugin event: ${event} (%o)`, ids)

    switch (event) {
      case 'dev-server:start':
        return wrapDevServer(this.ipc, this.invoke, ids, args)
      case 'file:preprocessor':
        return wrapPreprocessor(this.ipc, this.invoke, ids, args)
      case 'before:run':
      case 'before:spec':
      case 'after:run':
      case 'after:spec':
      case 'after:screenshot':
      case '_process:cross:origin:callback':
        return wrapChildPromise(this.ipc, this.invoke, ids, args)
      case 'task':
        return this.taskExecute(ids, args)
      case '_get:task:keys':
        return this.taskGetKeys(ids)
      case '_get:task:body':
        return this.taskGetBody(ids, args)
      case 'before:browser:launch':
        return wrapBeforeBrowserLaunch(this.ipc, this.invoke, ids, args)
      case 'after:browser:launch':
        return wrapChildPromise(this.ipc, this.invoke, ids, args)
      default:
        debug('unexpected execute message:', event, args)

        return
    }
  }

  invoke = (eventId: number, args: any[] = []) => {
    const event = this.registeredEventsById[eventId]

    return (event.handler as (...handlerArgs: any[]) => any)(...args)
  }

  taskGetBody (ids: PluginInvokeIds, args: any[]) {
    const [event] = args
    const taskEvent = _.find(this.registeredEventsById, { event: 'task' })
    const invoke = () => {
      const fn = taskEvent && (taskEvent.handler as TaskEventHandler)[event]

      return _.isFunction(fn) ? fn.toString() : ''
    }

    wrapChildPromise(this.ipc, invoke, ids)
  }

  taskGetKeys (ids: PluginInvokeIds) {
    const taskEvent = _.find(this.registeredEventsById, { event: 'task' })
    const invoke = () => _.keys(taskEvent ? taskEvent.handler : {})

    wrapChildPromise(this.ipc, invoke, ids)
  }

  taskMerge (target: TaskEventHandler, events: TaskEventHandler) {
    const duplicates = _.intersection(_.keys(target), _.keys(events))

    if (duplicates.length) {
      require('@packages/errors').warning('DUPLICATE_TASK_KEY', duplicates)
    }

    return _.extend(target, events)
  }

  taskExecute (ids: PluginInvokeIds, args: any[]) {
    const task = args[0]
    let arg = args[1]

    // ipc converts undefined to null.
    // we're restoring it.
    if (arg && arg.__cypress_task_no_argument__) {
      arg = undefined
    }

    const invoke = (eventId: number, invokeArgs: any[] = []) => {
      const handler = _.get(this.registeredEventsById, `${eventId}.handler.${task}`)

      if (_.isFunction(handler)) {
        return handler(...invokeArgs)
      }

      return '__cypress_unhandled__'
    }

    wrapChildPromise(this.ipc, invoke, ids, [arg])
  }

  _getDefaultPreprocessor (config: Cypress.PluginConfigOptions) {
    const tsPath = resolveTypescript(config.projectRoot)
    const options = {
      ...tsPath && { typescript: tsPath },
    }

    debug('creating webpack batteries included preprocessor with options %o', options)

    const webpackPreprocessor = require('@cypress/webpack-batteries-included-preprocessor')

    return webpackPreprocessor(options)
  }
}
