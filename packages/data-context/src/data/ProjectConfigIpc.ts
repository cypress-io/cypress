/* eslint-disable no-dupe-class-members */
import { CypressError, getError } from '@packages/errors'
import type { TestingType } from '@packages/types'
import { ChildProcess, fork, ForkOptions } from 'child_process'
import EventEmitter from 'events'
import path from 'path'
import inspector from 'inspector'
import debugLib from 'debug'
import { autoBindDebug } from '../util'
import _ from 'lodash'

const debug = debugLib(`cypress:lifecycle:ProjectConfigIpc`)

const CHILD_PROCESS_FILE_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')

export type IpcHandler = (ipc: ProjectConfigIpc) => void

export interface SetupNodeEventsReply {
  setupConfig: Cypress.ConfigOptions | null
  requires: string[]
  registrations: Array<{event: string, eventId: string}>
}

export interface LoadConfigReply {
  initialConfig: Cypress.ConfigOptions
  requires: string[]
}

export interface SerializedLoadConfigReply {
  initialConfig: string // stringified Cypress.ConfigOptions
  requires: string[]
}

/**
 * The ProjectConfigIpc is an EventEmitter wrapping the childProcess,
 * adding a "send" method for sending events from the parent process into the childProcess,
 *
 */
export class ProjectConfigIpc extends EventEmitter {
  private _childProcess: ChildProcess

  constructor (
    readonly nodePath: string | undefined | null,
    readonly projectRoot: string,
    readonly configFilePath: string,
    readonly configFile: string | false,
    readonly onError: (cypressError: CypressError, title?: string | undefined) => void,
    readonly onWarning: (cypressError: CypressError) => void,
  ) {
    super()
    this._childProcess = this.forkConfigProcess()
    this._childProcess.on('error', (err) => {
      // this.emit('error', err)
    })

    this._childProcess.on('message', (msg: { event: string, args: any[] }) => {
      this.emit(msg.event, ...msg.args)
    })

    this._childProcess.once('disconnect', () => {
      this.emit('disconnect')
    })

    return autoBindDebug(this)
  }

  // TODO: options => Cypress.TestingTypeOptions
  send(event: 'execute:plugins', evt: string, ids: {eventId: string, invocationId: string}, args: any[]): boolean
  send(event: 'setupTestingType', testingType: TestingType, options: Cypress.PluginConfigOptions): boolean
  send(event: 'loadConfig'): boolean
  send (event: string, ...args: any[]) {
    if (this._childProcess.killed || !this._childProcess.connected) {
      return false
    }

    return this._childProcess.send({ event, args })
  }

  on(evt: 'childProcess:unhandledError', listener: (err: CypressError) => void): this

  on(evt: 'warning', listener: (warningErr: CypressError) => void): this
  on (evt: string, listener: (...args: any[]) => void) {
    return super.on(evt, listener)
  }

  once(evt: `promise:fulfilled:${string}`, listener: (err: any, value: any) => void): this

  /**
   * When the config is loaded, it comes back with either a "reply", or an "error" if there was a problem
   * sourcing the config (script error, etc.)
   */
  once(evt: 'ready', listener: () => void): this
  once(evt: 'loadConfig:reply', listener: (payload: SerializedLoadConfigReply) => void): this
  once(evt: 'loadConfig:error', listener: (err: CypressError) => void): this

  /**
   * When
   */
  once(evt: 'setupTestingType:reply', listener: (payload: SetupNodeEventsReply) => void): this
  once(evt: 'setupTestingType:error', listener: (error: CypressError) => void): this
  once (evt: string, listener: (...args: any[]) => void) {
    return super.once(evt, listener)
  }

  emit (evt: string, ...args: any[]) {
    return super.emit(evt, ...args)
  }

  loadConfig (): Promise<LoadConfigReply> {
    return new Promise((resolve, reject) => {
      if (this._childProcess.stdout && this._childProcess.stderr) {
        // manually pipe plugin stdout and stderr for dashboard capture
        // @see https://github.com/cypress-io/cypress/issues/7434
        this._childProcess.stdout.on('data', (data) => process.stdout.write(data))
        this._childProcess.stderr.on('data', (data) => process.stderr.write(data))
      }

      let resolved = false

      this._childProcess.on('error', (err) => {
        this.handleChildProcessError(err, this, resolved, reject)
        reject(err)
      })

      /**
       * This reject cannot be caught anywhere??
       *
       * It's supposed to be caught on lib/modes/run.js:1689,
       * but it's not.
       */
      this.on('childProcess:unhandledError', (err) => {
        this.handleChildProcessError(err, this, resolved, reject)
        reject(err)
      })

      this.once('loadConfig:reply', (val) => {
        debug('loadConfig:reply')
        resolve({ ...val, initialConfig: JSON.parse(val.initialConfig) })
        resolved = true
      })

      this.once('loadConfig:error', (err) => {
        this.killChildProcess(this._childProcess)
        reject(err)
      })

      debug('trigger the load of the file')
      this.once('ready', () => {
        this.send('loadConfig')
      })
    })
  }

  registerSetupIpcHandlers (): Promise<SetupNodeEventsReply> {
    return new Promise((resolve, reject) => {
      let resolved = false

      this._childProcess.on('error', (err) => {
        this.handleChildProcessError(err, this, resolved, reject)
        reject(err)
      })

      // For every registration event, we want to turn into an RPC with the child process
      this.once('setupTestingType:reply', (val) => {
        resolved = true
        resolve(val)
      })

      this.once('setupTestingType:error', (err) => {
        reject(err)
      })

      const handleWarning = (warningErr: CypressError) => {
        debug('plugins process warning:', warningErr.stack)

        return this.onWarning(warningErr)
      }

      this.on('warning', handleWarning)
    })
  }

  private forkConfigProcess () {
    const configProcessArgs = ['--projectRoot', this.projectRoot, '--file', this.configFilePath]
    // allow the use of ts-node in subprocesses tests by removing the env constant from it
    // without this line, packages/ts/register.js never registers the ts-node module for config and
    // run_plugins can't use the config module.
    const { CYPRESS_INTERNAL_E2E_TESTING_SELF, ...env } = process.env

    env.NODE_OPTIONS = process.env.ORIGINAL_NODE_OPTIONS || ''

    const childOptions: ForkOptions = {
      stdio: 'pipe',
      cwd: path.dirname(this.configFilePath),
      env,
      execPath: this.nodePath ?? undefined,
    }

    if (inspector.url()) {
      childOptions.execArgv = _.chain(process.execArgv.slice(0))
      .remove('--inspect-brk')
      .push(`--inspect=${process.debugPort + 1}`)
      .value()
    }

    debug('fork child process', CHILD_PROCESS_FILE_PATH, configProcessArgs, _.omit(childOptions, 'env'))

    const proc = fork(CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)

    return proc
  }

  private handleChildProcessError (err: any, ipc: ProjectConfigIpc, resolved: boolean, reject: (reason?: any) => void) {
    debug('plugins process error:', err.stack)

    this.cleanupIpc()

    err = getError('CONFIG_FILE_UNEXPECTED_ERROR', this.configFile || '(unknown config file)', err)
    err.title = 'Config process error'

    // this can sometimes trigger before the promise is fulfilled and
    // sometimes after, so we need to handle each case differently
    if (resolved) {
      this.onError(err)
    } else {
      reject(err)
    }
  }

  cleanupIpc () {
    this.killChildProcess()
    this.removeAllListeners()
  }

  private killChildProcess () {
    this._childProcess.kill()
    this._childProcess.stdout?.removeAllListeners()
    this._childProcess.stderr?.removeAllListeners()
    this._childProcess.removeAllListeners()
  }
}
