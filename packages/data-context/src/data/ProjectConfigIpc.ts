/* eslint-disable no-dupe-class-members */
import { CypressError, getError } from '@packages/errors'
import type { FullConfig, TestingType } from '@packages/types'
import { ChildProcess, fork, ForkOptions, spawn } from 'child_process'
import EventEmitter from 'events'
import fs from 'fs-extra'
import path from 'path'
import inspector from 'inspector'
import debugLib from 'debug'
import { autoBindDebug, hasTypeScriptInstalled, toPosix } from '../util'
import _ from 'lodash'
import { pathToFileURL } from 'url'
import os from 'os'
import semver from 'semver'
import type { OTLPTraceExporterCloud } from '@packages/telemetry'
import { telemetry, encodeTelemetryContext } from '@packages/telemetry'

const pkg = require('@packages/root')
const debug = debugLib(`cypress:lifecycle:ProjectConfigIpc`)

const CHILD_PROCESS_FILE_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')

const tsNodeEsm = pathToFileURL(require.resolve('ts-node/esm/transpile-only')).href
const tsNode = toPosix(require.resolve('@packages/server/lib/plugins/child/register_ts_node'))

export type IpcHandler = (ipc: ProjectConfigIpc) => void

/**
 * If running as root on Linux, no-sandbox must be passed or Chrome will not start
 */
const isSandboxNeeded = () => {
  // eslint-disable-next-line no-restricted-properties
  return (os.platform() === 'linux') && (process.geteuid && process.geteuid() === 0)
}

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
    readonly nodeVersion: string | undefined | null,
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

    // This forwards telemetry requests from the child process to the server
    this.on('export:telemetry', (data) => {
      // Not too worried about tracking successes
      (telemetry.exporter() as OTLPTraceExporterCloud)?.send(data, () => {}, (err) => {
        debug('error exporting telemetry data from child process %s', err)
      })
    })

    return autoBindDebug(this)
  }

  get childProcessPid () {
    return this._childProcess?.pid
  }

  // TODO: options => Cypress.TestingTypeOptions
  send(event: 'execute:plugins', evt: string, ids: {eventId: string, invocationId: string}, args: any[]): boolean
  send(event: 'setupTestingType', testingType: TestingType, options: Cypress.PluginConfigOptions): boolean
  send(event: 'loadConfig'): boolean
  send(event: 'main:process:will:disconnect'): void
  send (event: string, ...args: any[]) {
    if (this._childProcess.killed || !this._childProcess.connected) {
      return false
    }

    return this._childProcess.send({ event, args })
  }

  on(evt: 'childProcess:unhandledError', listener: (err: CypressError) => void): this
  on(evt: 'export:telemetry', listener: (data: string) => void): void
  on(evt: 'main:process:will:disconnect:ack', listener: () => void): void
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
        // manually pipe plugin stdout and stderr for Cypress Cloud capture
        // @see https://github.com/cypress-io/cypress/issues/7434
        this._childProcess.stdout.on('data', (data) => process.stdout.write(data))
        this._childProcess.stderr.on('data', (data) => process.stderr.write(data))
      }

      let resolved = false

      this._childProcess.on('error', (err) => {
        debug('unhandled error in child process %s', err)
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
        debug('unhandled error in child process %s', err)
        this.handleChildProcessError(err, this, resolved, reject)
        reject(err)
      })

      this.once('loadConfig:reply', (val) => {
        debug('loadConfig:reply')
        resolve({ ...val, initialConfig: JSON.parse(val.initialConfig) })
        resolved = true
      })

      this.once('loadConfig:error', (err) => {
        debug('error loading config %s', err)
        this.killChildProcess()
        reject(err)
      })

      debug('trigger the load of the file')
      this.once('ready', () => {
        this.send('loadConfig')
      })
    })
  }

  async callSetupNodeEventsWithConfig (testingType: TestingType, config: FullConfig, handlers: IpcHandler[]): Promise<SetupNodeEventsReply> {
    for (const handler of handlers) {
      handler(this)
    }

    const promise = this.registerSetupIpcHandlers()

    const overrides = config[testingType] ?? {}
    const mergedConfig = { ...config, ...overrides }

    // alphabetize config by keys
    let orderedConfig = {} as Cypress.PluginConfigOptions

    Object.keys(mergedConfig).sort().forEach((key) => {
      const k = key as keyof typeof mergedConfig

      // @ts-ignore
      orderedConfig[k] = mergedConfig[k]
    })

    this.send('setupTestingType', testingType, {
      ...orderedConfig,
      projectRoot: this.projectRoot,
      configFile: this.configFilePath,
      version: pkg.version,
      testingType,
    })

    return promise
  }

  private registerSetupIpcHandlers (): Promise<SetupNodeEventsReply> {
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
        this.onError(err)
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
    const env = _.omit(process.env, 'CYPRESS_INTERNAL_E2E_TESTING_SELF')

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

    debug('fork child process %o', { CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions: _.omit(childOptions, 'env') })

    let isProjectUsingESModules = false

    try {
      // TODO: convert this to async FS methods
      // eslint-disable-next-line no-restricted-syntax
      const pkgJson = fs.readJsonSync(path.join(this.projectRoot, 'package.json'))

      isProjectUsingESModules = pkgJson.type === 'module'
    } catch (e) {
      // project does not have `package.json` or it was not found
      // reasonable to assume not using es modules
    }

    if (!childOptions.env) {
      childOptions.env = {}
    }

    // If they've got TypeScript installed, we can use
    // ts-node for CommonJS
    // ts-node/esm for ESM
    if (hasTypeScriptInstalled(this.projectRoot)) {
      debug('found typescript in %s', this.projectRoot)
      if (isProjectUsingESModules) {
        debug(`using --experimental-specifier-resolution=node with --loader ${tsNodeEsm}`)
        // Use the ts-node/esm loader so they can use TypeScript with `"type": "module".
        // The loader API is experimental and will change.
        // The same can be said for the other alternative, esbuild, so this is the
        // best option that leverages the existing modules we bundle in the binary.
        // @see ts-node esm loader https://typestrong.org/ts-node/docs/usage/#node-flags-and-other-tools
        // @see Node.js Loader API https://nodejs.org/api/esm.html#customizing-esm-specifier-resolution-algorithm
        let tsNodeEsmLoader = `--experimental-specifier-resolution=node --loader ${tsNodeEsm}`

        // in nodejs 22.7.0, the --experimental-detect-module option is now enabled by default.
        // We need to disable it with the --no-experimental-detect-module flag.
        // @see https://github.com/cypress-io/cypress/issues/30084
        if (this.nodeVersion && semver.gte(this.nodeVersion, '22.7.0')) {
          debug(`detected node version ${this.nodeVersion}, adding --no-experimental-detect-module option to child_process NODE_OPTIONS.`)
          tsNodeEsmLoader = `${tsNodeEsmLoader} --no-experimental-detect-module`
        }

        if (childOptions.env.NODE_OPTIONS) {
          childOptions.env.NODE_OPTIONS += ` ${tsNodeEsmLoader}`
        } else {
          childOptions.env.NODE_OPTIONS = tsNodeEsmLoader
        }
      } else {
        // Not using ES Modules (via "type": "module"),
        // so we just register the standard ts-node module
        // to handle TypeScript that is compiled to CommonJS.
        // We do NOT use the `--loader` flag because we have some additional
        // custom logic for ts-node when used with CommonJS that needs to be evaluated
        // so we need to load and evaluate the hook first using the `--require` module API.
        const tsNodeLoader = `--require "${tsNode}"`

        debug(`using cjs with --require ${tsNode}`)

        if (childOptions.env.NODE_OPTIONS) {
          childOptions.env.NODE_OPTIONS += ` ${tsNodeLoader}`
        } else {
          childOptions.env.NODE_OPTIONS = tsNodeLoader
        }
      }
    } else {
      // Just use Node's built-in ESM support.
      // TODO: Consider using userland `esbuild` with Node's --loader API to handle ESM.
      debug(`no typescript found, just use regular Node.js`)
    }

    const telemetryCtx = encodeTelemetryContext({ context: telemetry.getActiveContextObject(), version: pkg.version })

    // Pass the active context from the main process to the child process as the --telemetryCtx flag.
    configProcessArgs.push('--telemetryCtx', telemetryCtx)

    if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT) {
      if (isSandboxNeeded()) {
        configProcessArgs.push('--no-sandbox')
      }

      return spawn(process.execPath, ['--entryPoint', CHILD_PROCESS_FILE_PATH, ...configProcessArgs], {
        ...childOptions,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      })
    }

    return fork(CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)
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
