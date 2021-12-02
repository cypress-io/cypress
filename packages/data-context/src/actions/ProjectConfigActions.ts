import childProcess, { ChildProcess, ForkOptions } from 'child_process'
import _ from 'lodash'
import path from 'path'
import { EventEmitter } from 'events'
import pDefer from 'p-defer'
import { CypressErrorLike, isCypressError } from '@packages/types'
import Bluebird from 'bluebird'

import type { DataContext } from '..'
import inspector from 'inspector'
import type { CurrentProjectDataSource } from '../sources'
import assert from 'assert'
import type { ConfigIpc, EventRegistration, RegisteredEvents } from '../data/coreDataShape'
import type { Immutable } from 'immer'

const UNDEFINED_SERIALIZED = '__cypress_undefined__'

// ERROR_WRITING_FILE
// ERROR_READING_FILE
// CONFIG_FILE_NOT_FOUND

/**
 * Manages the lifecycle of the Config sourcing & Plugin execution
 */
export class ConfigFileActions {
  constructor (private ctx: DataContext, private currentProject: CurrentProjectDataSource) {}

  static CHILD_PROCESS_FILE_PATH = path.join(__dirname, '../../../server/lib/util', 'require_async_child.js')

  updateFromServerStart () {
    // if we didnt have a cfg.port
    // then get the port once we
    // open the server
    if (!cfg.port) {
      cfg.port = port

      // and set all the urls again
      _.extend(cfg, config.setUrls(cfg))
    }

    cfg.proxyServer = cfg.proxyUrl

    // save the last time they opened the project
    // along with the first time they opened it
    const now = Date.now()
    const stateToSave = {
      lastOpened: now,
    } as any

    if (!cfg.state || !cfg.state.firstOpened) {
      stateToSave.firstOpened = now
    }
  }

  execute (eventName: string, config: object = {}, ...args: any[]) {
    // Bluebird, for backward compat
    return Bluebird.try(async () => {
      const pluginFn = this.ctx.coreData.currentProject?.pluginRegistry?.[eventName]

      try {
        if (!pluginFn) {
          return
        }

        this.ctx.debugNs('plugin', `execute plugin event '${event}' Node '${process.version}' with args: %o %o %o`, ...args)
        await pluginFn(...args)
      } catch (e) {
        throw this.ctx.error('PLUGINS_RUN_EVENT_ERROR', eventName, e?.stack || e?.message || e || '')
      }
    })
  }

  killChildProcess () {
    this.ctx.update((o) => {
      if (o.currentProject?.configChildProcess) {
        o.currentProject.configChildProcess.process.kill()
      }
    })
  }

  /**
   * Called after the config is sourced, once we've determined a testing type
   */
  runSetupNodeEvents (ipc: ConfigIpc) {
    const dfd = pDefer<null | { newConfig: Cypress.ResolvedConfigOptions, registeredEvents: RegisteredEvents }>()

    // TODO: Move these into the Data Context
    const handlers = this.ctx._apis.projectApi.getPluginIpcHandlers()

    assert(this.currentProject.currentTestingType, 'expected testing type in runSetupNodeEvents')

    ipc.on('empty:plugins', () => dfd.resolve(null))

    ipc.on('load:error:plugins', (type, ...args) => {
      this.ctx.debugNs('plugin', 'load:error %s, rejecting', type)

      dfd.reject(this.ctx.error(type, ...args))
    })

    ipc.on('loaded:plugins', (cfg, registrations) => {
      dfd.resolve(this._handleLoadedPlugins(ipc, cfg, registrations))
    })

    for (const handler of handlers) {
      handler(ipc)
    }

    const configOpts = this.ctx.projectConfig.makeSetupNodeEventsConfig()

    ipc.send(
      'plugins',
      this.currentProject.currentTestingType,
      configOpts,
    )

    return dfd.promise
  }

  refreshConfigProcess () {
    assert(this.ctx.actions.projectConfig, 'Expected projectConfig for refreshConfigProcess')

    const { child, ipc, configPromise } = this.ctx.actions.projectConfig.forkConfigProcess()

    this.ctx.update((o) => {
      if (o.currentProject) {
        o.currentProject.configChildProcess = {
          ipc,
          baseConfigPromise: configPromise,
          executedPlugins: null,
          process: child,
          registeredEvents: {},
        }
      }
    })

    return { child, ipc, configPromise }
  }

  forkConfigProcess () {
    const { projectRoot, configFilePath } = this.currentProject

    assert(projectRoot, 'projectRoot needed to forkConfigProcess')
    assert(configFilePath, 'configFilePath needed to forkConfigProcess')

    const configProcessArgs = ['--projectRoot', projectRoot, '--file', configFilePath]

    const childOptions: ForkOptions = {
      stdio: 'pipe',
      cwd: path.dirname(configFilePath),
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.ORIGINAL_NODE_OPTIONS || '',
      },
      execPath: this.ctx.coreData.userNodePath ?? undefined,
    }

    if (inspector.url()) {
      childOptions.execArgv = _.chain(process.execArgv.slice(0))
      .remove('--inspect-brk')
      .push(`--inspect=${process.debugPort + 1}`)
      .value()
    }

    this.ctx.debug('fork child process', ConfigFileActions.CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)

    const child = childProcess.fork(ConfigFileActions.CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)
    const dfd = pDefer<Immutable<Cypress.ConfigOptionsIpcResponse>>()

    return {
      child,
      ipc: this.wrapConfigProcess(child, dfd),
      configPromise: dfd.promise,
    }
  }

  private wrapConfigProcess (child: ChildProcess, dfd: pDefer.DeferredPromise<Immutable<Cypress.ConfigOptionsIpcResponse>>) {
    const ipc = this.wrapIpc(child)

    if (child.stdout && child.stderr) {
      // manually pipe plugin stdout and stderr for dashboard capture
      // @see https://github.com/cypress-io/cypress/issues/7434
      child.stdout.on('data', (data) => process.stdout.write(data))
      child.stderr.on('data', (data) => process.stderr.write(data))
    }

    ipc.on('loaded', (result) => {
      this.ctx.debug('resolving with result %o', result)
      dfd.resolve(result)
    })

    ipc.on('load:error', (type, ...args) => {
      this.ctx.debug('load:error %s, rejecting', type)
      child.kill()

      const err = this.ctx.error(type, ...args)

      // if it's a non-cypress error, restore the initial error
      if (!isCypressError(err)) {
        err.isCypressErr = false
        err.message = args[1]
        err.code = type
        err.name = type
      }

      dfd.reject(err)
    })

    this.ctx.debug('trigger the load of the file')
    ipc.send('load')

    return ipc
  }

  protected wrapIpc (aProcess: ChildProcess): ConfigIpc {
    const emitter = new EventEmitter()

    aProcess.on('message', (message: { event: string, args: any}) => {
      return emitter.emit(message.event, ...message.args)
    })

    // prevent max listeners warning on ipc
    // @see https://github.com/cypress-io/cypress/issues/1305#issuecomment-780895569
    emitter.setMaxListeners(Infinity)

    return {
      send (event: any, ...args: any) {
        if (aProcess.killed) {
          return false
        }

        return aProcess.send({
          event,
          args,
        })
      },

      on: emitter.on.bind(emitter),
      removeListener: emitter.removeListener.bind(emitter),
    }
  }

  private _handleLoadedPlugins (ipc: ConfigIpc, newCfg: Cypress.ResolvedConfigOptions, registrations: EventRegistration[]) {
    const newConfig = _.omit(newCfg, 'projectRoot', 'configFile')
    const registeredEvents: Record<string, Function> = {}

    // For every registration event, we want to turn into an RPC with the child process
    for (const registration of registrations) {
      this.ctx.debug('register plugins process event', registration.event, 'with id', registration.eventId)
      registeredEvents[registration.event] = (...args: any[]) => {
        const dfd = pDefer()
        const invocationId = _.uniqueId('inv')

        this.ctx.debug('call event', registration.event, 'for invocation id', invocationId)

        const handlePromise = (err: undefined | CypressErrorLike, value: any) => {
          ipc.removeListener(`promise:fulfilled:${invocationId}`, handlePromise)

          if (err) {
            this.ctx.debug('promise rejected for id %s %o', invocationId, ':', err.stack)
            dfd.reject(_.extend(new Error(err.message), err))

            return
          }

          if (value === UNDEFINED_SERIALIZED) {
            value = undefined
          }

          this.ctx.debugNs('plugin', `promise resolved for id '${invocationId}' with value`, value)

          return dfd.resolve(value)
        }

        ipc.on(`promise:fulfilled:${invocationId}`, handlePromise)
        const ids = { invocationId, eventId: registration.eventId }

        // no argument is passed for cy.task()
        // This is necessary because undefined becomes null when it is sent through ipc.
        if (registration.event === 'task' && args[1] === undefined) {
          args[1] = {
            __cypress_task_no_argument__: true,
          }
        }

        ipc.send('execute:plugins', registration.event, ids, args)

        return dfd.promise
      }
    }

    return { newConfig, registeredEvents }
  }
}
