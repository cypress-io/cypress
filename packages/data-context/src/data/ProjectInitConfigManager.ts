import { ChildProcess, fork, ForkOptions } from 'child_process'
import path from 'path'
import inspector from 'inspector'
import debugLib from 'debug'
import { LoadConfigReply, ProjectConfigIpc } from './ProjectConfigIpc'
import _ from 'lodash'
import { autoBindDebug } from '../util/autoBindDebug'
import { CypressError, getError } from '@packages/errors'

const debug = debugLib(`cypress:lifecycle:ProjectInitialConfigManager`)

const CHILD_PROCESS_FILE_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')

interface ProjectInitialConfigManagerOptions {
  configFile: string | false
  projectRoot: string
  configFilePath: string
  nodePath: string | null | undefined
  onError: (cypressError: CypressError, title?: string | undefined) => void
}

export class ProjectInitialConfigManager {
  private _ipc: ProjectConfigIpc | undefined
  private _process: ChildProcess | undefined
  private _projectInitialConfigPromise: Promise<LoadConfigReply> | undefined
  private _childProcesses = new Set<ChildProcess>()

  constructor (private options: ProjectInitialConfigManagerOptions) {
    return autoBindDebug(this)
  }

  get ipc () {
    return this._ipc
  }

  loadConfig () {
    if (!this._projectInitialConfigPromise) {
      this._projectInitialConfigPromise = this.startProcessAndLoadInitialConfig()
    }

    return this._projectInitialConfigPromise
  }

  private startProcessAndLoadInitialConfig () {
    // If there's already a dangling IPC from a previous load, we want to clean this up
    if (this._ipc) {
      this.cleanupIpc(this._ipc)
    }

    const process = this.forkConfigProcess()

    return this.wrapConfigProcess(process)
  }

  private forkConfigProcess () {
    const configProcessArgs = ['--projectRoot', this.options.projectRoot, '--file', this.options.configFilePath]
    // allow the use of ts-node in subprocesses tests by removing the env constant from it
    // without this line, packages/ts/register.js never registers the ts-node module for config and
    // run_plugins can't use the config module.
    const { CYPRESS_INTERNAL_E2E_TESTING_SELF, ...env } = process.env

    env.NODE_OPTIONS = process.env.ORIGINAL_NODE_OPTIONS || ''

    const childOptions: ForkOptions = {
      stdio: 'pipe',
      cwd: path.dirname(this.options.configFilePath),
      env,
      execPath: this.options.nodePath ?? undefined,
    }

    if (inspector.url()) {
      childOptions.execArgv = _.chain(process.execArgv.slice(0))
      .remove('--inspect-brk')
      .push(`--inspect=${process.debugPort + this._childProcesses.size + 1}`)
      .value()
    }

    debug('fork child process', CHILD_PROCESS_FILE_PATH, configProcessArgs, _.omit(childOptions, 'env'))

    const proc = fork(CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)

    this._childProcesses.add(proc)

    return proc
  }

  private wrapConfigProcess (child: ChildProcess): Promise<LoadConfigReply> {
    return new Promise((resolve, reject) => {
      let resolved = false

      // The "IPC" is an EventEmitter wrapping the child process, adding a "send"
      // method, and re-emitting any "message" that comes through the channel through the EventEmitter
      const ipc = new ProjectConfigIpc(child)

      if (child.stdout && child.stderr) {
        // manually pipe plugin stdout and stderr for dashboard capture
        // @see https://github.com/cypress-io/cypress/issues/7434
        child.stdout.on('data', (data) => process.stdout.write(data))
        child.stderr.on('data', (data) => process.stderr.write(data))
      }

      child.on('error', (err) => {
        this.handleChildProcessError(err, ipc, reject, resolved)
      })

      /**
       * This reject cannot be caught anywhere??
       *
       * It's supposed to be caught on lib/modes/run.js:1689,
       * but it's not.
       */
      ipc.on('childProcess:unhandledError', (err) => {
        this.handleChildProcessError(err, ipc, reject, resolved)
      })

      ipc.once('loadConfig:reply', (val) => {
        debug('loadConfig:reply')
        resolved = true
        resolve({ ...val, initialConfig: JSON.parse(val.initialConfig) })
      })

      ipc.once('loadConfig:error', (err) => {
        this.killChildProcess(child)
        reject(err)
      })

      debug('trigger the load of the file')
      ipc.once('ready', () => {
        ipc.send('loadConfig')
      })

      this._ipc = ipc
    })
  }

  private handleChildProcessError (err: any, ipc: ProjectConfigIpc, reject: (reason?: any) => void, resolved: boolean) {
    debug('plugins process error:', err.stack)

    this.cleanupIpc(ipc)

    err = getError('CONFIG_FILE_UNEXPECTED_ERROR', this.options.configFile || '(unknown config file)', err)
    err.title = 'Config process error'

    // this can sometimes trigger before the promise is fulfilled and
    // sometimes after, so we need to handle each case differently
    if (resolved) {
      this.options.onError(err)
    } else {
      reject(err)
    }
  }

  private killChildProcess (child: ChildProcess) {
    child.kill()
    child.stdout?.removeAllListeners()
    child.stderr?.removeAllListeners()
    child.removeAllListeners()
  }

  private cleanupIpc (ipc: ProjectConfigIpc) {
    this.cleanupProcess(ipc.childProcess)
    ipc.removeAllListeners()
    if (this._ipc === ipc) {
      this._ipc = undefined
    }

    if (this._process === ipc.childProcess) {
      this._process = undefined
    }
  }

  private cleanupProcess (proc: ChildProcess) {
    this.killChildProcess(proc)
    this._childProcesses.delete(proc)
  }

  private killChildProcesses () {
    for (const proc of this._childProcesses) {
      this.cleanupProcess(proc)
    }
    this._childProcesses = new Set()
  }

  destroy () {
    if (this.ipc) {
      this.cleanupIpc(this.ipc)
    }

    // this.killChildProcesses()
    // this._process = undefined
    // this._projectInitialConfigPromise = undefined
  }
}
