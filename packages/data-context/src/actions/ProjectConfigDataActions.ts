import childProcess, { ChildProcess, ForkOptions } from 'child_process'
import _ from 'lodash'
import path from 'path'
import { EventEmitter } from 'events'
import pDefer from 'p-defer'

import type { DataContext } from '..'
import inspector from 'inspector'
import semver from 'semver'

interface ForkConfigProcessOptions {
  projectRoot: string
  configFilePath: string
}

/**
 * Manages the lifecycle of the Config sourcing & Plugin execution
 */
export class ProjectConfigDataActions {
  constructor (private ctx: DataContext) {}

  static CHILD_PROCESS_FILE_PATH = path.join(__dirname, '../../../server/lib/util', 'require_async_child.js')

  killConfigProcess () {
    if (this.ctx.currentProject?.configChildProcess) {
      this.ctx.currentProject.configChildProcess.process.kill()
      this.ctx.currentProject.configChildProcess = null
    }
  }

  async refreshProjectConfig (configFilePath: string) {
    if (!this.ctx.currentProject) {
      throw new Error('Can\'t refresh project config without current project')
    }

    this.killConfigProcess()

    const process = await this.forkConfigProcess({
      projectRoot: this.ctx.currentProject.projectRoot,
      configFilePath,
    })
    const dfd = pDefer<Cypress.ConfigOptions>()

    if (!process) {
      return
    }

    this.ctx.currentProject.configChildProcess = {
      process,
      executedPlugins: null,
      resolvedBaseConfig: dfd.promise,
    }

    this.wrapConfigProcess(process, dfd)

    return dfd.promise as Cypress.ConfigOptions
  }

  getChildOptions (config: {
    resolvedNodePath?: string
    resolvedNodeVersion?: string
   }): ForkOptions {
    const childOptions: ForkOptions = {
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.ORIGINAL_NODE_OPTIONS || '',
      },
    }

    if (config.resolvedNodePath) {
      this.ctx.debug('launching using custom node version %o', _.pick(config, ['resolvedNodePath', 'resolvedNodeVersion']))
      childOptions.execPath = config.resolvedNodePath
    }

    // https://github.com/cypress-io/cypress/issues/18914
    // If we're on node version 17 or higher, we need the
    // NODE_ENV --openssl-legacy-provider so that webpack can continue to use
    // the md4 hash function. This would cause an error prior to node 17
    // though, so we have to detect node's major version before spawning the
    // plugins process.

    // To be removed on update to webpack >= 5.61, which no longer relies on
    // node's builtin crypto.hash function.
    if (childOptions.env && config.resolvedNodeVersion && semver.satisfies(config.resolvedNodeVersion, '>=17.0.0')) {
      childOptions.env.NODE_OPTIONS += ' --openssl-legacy-provider'
    }

    if (inspector.url()) {
      childOptions.execArgv = _.chain(process.execArgv.slice(0))
      .remove('--inspect-brk')
      .push(`--inspect=${process.debugPort + 1}`)
      .value()
    }

    return childOptions
  }

  private async forkConfigProcess (opts: ForkConfigProcessOptions) {
    const configProcessArgs = ['--projectRoot', opts.projectRoot, '--file', opts.configFilePath]

    const config = await this.ctx.currentProject?.config

    if (!config) {
      return
    }

    const childOptions = this.getChildOptions(config)

    this.ctx.debug('fork child process', ProjectConfigDataActions.CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)

    return childProcess.fork(ProjectConfigDataActions.CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)
  }

  private wrapConfigProcess (child: ChildProcess, dfd: pDefer.DeferredPromise<Cypress.ConfigOptions>) {
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
      this.killConfigProcess()

      const err = this.ctx._apis.projectApi.error.get(type, ...args)

      // if it's a non-cypress error, restore the initial error
      if (!(err.message?.length)) {
        err.isCypressErr = false
        err.message = args[1]
        err.code = type
        err.name = type
      }

      dfd.reject(err)
    })

    this.ctx.debug('trigger the load of the file')
    ipc.send('load')
  }

  protected wrapIpc (aProcess: ChildProcess) {
    const emitter = new EventEmitter()

    aProcess.on('message', (message: { event: string, args: any}) => {
      return emitter.emit(message.event, ...message.args)
    })

    // prevent max listeners warning on ipc
    // @see https://github.com/cypress-io/cypress/issues/1305#issuecomment-780895569
    emitter.setMaxListeners(Infinity)

    return {
      send (event: string, ...args: any) {
        if (aProcess.killed) {
          return
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
}
