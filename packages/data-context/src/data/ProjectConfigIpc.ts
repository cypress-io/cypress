/* eslint-disable no-dupe-class-members */
import { CypressError, getError } from '@packages/errors'
import type { DebugData, FullConfig, TestingType } from '@packages/types'
import { ChildProcess, fork, ForkOptions, spawn } from 'child_process'
import EventEmitter from 'events'
import fs from 'fs'
import path from 'path'
import inspector from 'inspector'
import debugLib from 'debug'
import { getTsconfig } from 'get-tsconfig'
import { autoBindDebug, hasTypeScriptInstalled, toPosix } from '../util'
import _ from 'lodash'
import os from 'os'
import semver from 'semver'
import type { OTLPTraceExporterCloud } from '@packages/telemetry'
import { telemetry, encodeTelemetryContext } from '@packages/telemetry'
import { TagStream } from '@packages/stderr-filtering'

const pkg = require('@packages/root')
const debug = debugLib(`cypress:lifecycle:ProjectConfigIpc`)
const debugVerbose = debugLib(`cypress-verbose:lifecycle:ProjectConfigIpc`)

// In dev the .ts source exists; in production only the compiled .js is present.
const resolveRequireAsyncChildPath = (): string => {
  const serverRoot = path.dirname(require.resolve('@packages/server/package.json'))
  const tsPath = path.join(serverRoot, 'lib/plugins/child/require_async_child.ts')

  if (fs.existsSync(tsPath)) {
    return tsPath
  }

  return require.resolve('@packages/server/lib/plugins/child/require_async_child.js')
}

const CHILD_PROCESS_FILE_PATH = resolveRequireAsyncChildPath()

debugVerbose(' using child process file path: %s', CHILD_PROCESS_FILE_PATH)

// NOTE: need the file:// prefix to avoid https://nodejs.org/api/errors.html#err_unsupported_esm_url_scheme on windows
const tsx = os.platform() === 'win32' ? `file://${toPosix(require.resolve('tsx'))}` : toPosix(require.resolve('tsx'))

export type PluginIpcHandler = (ipc: ProjectConfigIpc) => void

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

interface SerializedLoadConfigReply {
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
    readonly onDebugData: (debugData: DebugData) => void,
  ) {
    super()
    this._childProcess = this.forkConfigProcess()
    this._childProcess.on('error', (err: any) => {
      debug('child process error: %s', err)
    })

    this._childProcess.on('message', (msg: { event: string, args: any[] }) => {
      debug('received %s message from child process %s with args %o', msg.event, this._childProcess.pid, msg.args)
      this.emit(msg.event, ...msg.args)
    })

    this._childProcess.once('disconnect', () => {
      debug('received disconnect event from child process %s', this._childProcess.pid)
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
      debug('not sending %s message to child process. Killed? %s, Connected? %s', event, this._childProcess.killed, this._childProcess.connected)

      return false
    }

    debug('sending %s message to child process %s with args %o', event, this._childProcess.pid, args)

    return this._childProcess.send({ event, args })
  }

  on(evt: 'childProcess:unhandledError', listener: (err: CypressError) => void): this
  on(evt: 'export:telemetry', listener: (data: string) => void): void
  on(evt: 'main:process:will:disconnect:ack', listener: () => void): void
  on(evt: 'warning', listener: (warningErr: CypressError) => void): this
  on(evt: 'disconnect', listener: () => void): this
  on(evt: 'exit', listener: (code: number, signal: string) => void): this
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
  once(evt: 'file:preprocessor:overridden', listener: (payload: { handlerText: string }) => void): this
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
        this._childProcess.stdout.pipe(process.stdout)
        this._childProcess.stderr.pipe(new TagStream()).pipe(process.stderr)
      }

      let resolved = false

      this._childProcess.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EPIPE') {
          debug('EPIPE error in loadConfig() of child process %s', err)

          // @ts-ignore
          resolve()

          return
        }

        debug('unhandled error in child process %s', err)
        this.handleChildProcessError(err, this, resolved, reject)
        reject(err)
      })

      this._childProcess.on('exit', (code, signal) => {
        debug('child process %s exited with code %s and signal %s', this._childProcess.pid, code, signal)
        this.emit('exit', code, signal)
        this.cleanupIpc()
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

  async callSetupNodeEventsWithConfig (testingType: TestingType, config: FullConfig, handlers: PluginIpcHandler[]): Promise<SetupNodeEventsReply> {
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

      this._childProcess.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EPIPE') {
          debug('EPIPE error in registerSetupIpcHandlers() of child process %s', err)

          // @ts-ignore
          resolve()

          return
        }

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

      this.once('file:preprocessor:overridden', ({ handlerText }) => {
        debug('file:preprocessor:overridden: %s', handlerText)
        this.onDebugData({
          filePreprocessorHandlerText: handlerText,
        })
      })

      const handleWarning = (warningErr: CypressError) => {
        debug('plugins process warning:', warningErr.stack)

        return this.onWarning(warningErr)
      }

      this.on('warning', handleWarning)
    })
  }

  private forkConfigProcess (): ChildProcess {
    const configProcessArgs = ['--projectRoot', this.projectRoot, '--file', this.configFilePath]
    // we do NOT want telemetry enabled within our cy-in-cy tests as it isn't configured to handled it
    const env = _.omit(process.env, 'CYPRESS_INTERNAL_E2E_TESTING_SELF', 'CYPRESS_INTERNAL_ENABLE_TELEMETRY')

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
      // NOTE: The IDE in which you are working likely will not let attach to this process until it is running if using the --inspect option
      // If needing to debug the child process (webpack-dev-server/vite-dev-server/webpack-preprocessor(s)/config loading), you may want to use --inspect-brk instead
      // as it will NOT execute that process until you attach the debugger to it.
      .push(`--inspect=${process.debugPort + 1}`)
      .value()
    }

    /**
     * Before the introduction of tsx, Cypress used ts-node (@see https://github.com/TypeStrong/ts-node) with native node to try and load the user's cypress.config.ts file.
     * This presented problems because the Cypress node runtime runs in commonjs, which may not be compatible with the user's cypress.config.ts and tsconfig.json.
     * To mitigate the aforementioned runtime incompatibility, we used to force TypeScript options for the user in order to load their config inside the our node context
     * via a child process, which lead to clashes and issues (outlined in the comments below).
     * This is best explained historically in our docs which a screenshot can be see in @see https://github.com/cypress-io/cypress/issues/30426#issuecomment-2805204540 and can be seen
     * in an older version of the Cypress codebase (@see https://github.com/cypress-io/cypress/blob/v14.3.0/packages/server/lib/plugins/child/ts_node.js#L24)
     *
     * Attempted workarounds with ts-node and node: @see https://github.com/cypress-io/cypress/pull/28709
     * Example continued end user issues: @see https://github.com/cypress-io/cypress/issues/30954 and @see https://github.com/cypress-io/cypress/issues/30925
     * Spike into ts-node alternatives (a lot of useful comments on tsx): @see https://github.com/cypress-io/cypress/issues/30426
     * feature issue to replace ts-node as our end user TypeScript loader: @see https://github.com/cypress-io/cypress/issues/31185
     *
     * tsx (@see https://tsx.is/) is able to work with both CommonJS and ESM at the same time ( @see https://tsx.is/#seamless-cjs-%E2%86%94-esm-imports), which solves the problem of interoperability that
     * Cypress faced with ts-node and really just node itself. We no longer need experimental node flags and ts-node permutations to load the user's config file.
     * We can use tsx to load just about anything, including JavaScript files (@see https://github.com/privatenumber/ts-runtime-comparison)!
     */

    debug('fork child process %o', { CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions: _.omit(childOptions, 'env') })

    if (!childOptions.env) {
      childOptions.env = {}
    }

    /**
     * use --import for node versions
     * 20.6.0 and above for 20.x.x as --import is supported
     * use --loader for node under 20.6.0 for 20.x.x.
     * NOTE: we need to use double quotes around the tsx path to account for paths with spaces or special characters.
     * @see https://tsx.is/dev-api/node-cli#node-js-cli
     */
    let tsxLoader = this.nodeVersion && semver.lt(this.nodeVersion, '20.6.0') ? `--loader "${tsx}"` : `--import "${tsx}"`

    // If they've got TypeScript installed, we can use tsx for CommonJS and ESM.
    // @see https://tsx.is/dev-api/node-cli#node-js-cli
    const userHasTypeScriptInstalled = hasTypeScriptInstalled(this.projectRoot)

    if (userHasTypeScriptInstalled) {
      debug('found typescript in %s', this.projectRoot)

      // TODO: get the tsconfig.json that applies to the users cypress.config.ts file
      // right now, we are just using the tsconfig.json we find in the project root
      const tsConfig = getTsconfig(this.projectRoot)

      if (tsConfig) {
        debug(`tsconfig.json found at ${tsConfig.path}`)
        childOptions.env.TSX_TSCONFIG_PATH = tsConfig.path

        debugVerbose(`tsconfig.json parsed as follows: %o`, tsConfig.config)
      } else {
        debug(`No tsconfig.json found! Attempting to parse file without tsconfig.json.`)
      }
    }

    debug(`using generic ${tsxLoader} for esm and cjs ${userHasTypeScriptInstalled ? 'with TypeScript' : ''}.`)

    if (childOptions.env.NODE_OPTIONS) {
      childOptions.env.NODE_OPTIONS += ` ${tsxLoader}`
    } else {
      childOptions.env.NODE_OPTIONS = tsxLoader
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
    debug('cleaning up IPC')
    this.killChildProcess()
    this.removeAllListeners()
  }

  private killChildProcess (): void {
    this._childProcess.stdout?.removeAllListeners()
    this._childProcess.stderr?.removeAllListeners()
    this._childProcess.removeAllListeners()

    if (this._childProcess.killed || !this._childProcess.connected) {
      debug('child process %s already killed', this._childProcess.pid)

      return
    }

    debug('killing child process %s', this._childProcess.pid)
    this._childProcess.kill()
  }
}
