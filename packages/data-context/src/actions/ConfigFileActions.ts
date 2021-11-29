import childProcess, { ChildProcess, ForkOptions } from 'child_process'
import _ from 'lodash'
import path from 'path'
import { EventEmitter } from 'events'
import pDefer from 'p-defer'
import { isCypressError } from '@packages/types'
import type { DataContext } from '..'
import inspector from 'inspector'
import type { ProjectDataSource } from '../sources'
import assert from 'assert'

/**
 * Manages the lifecycle of the Config sourcing & Plugin execution
 */
export class ConfigFileActions {
  constructor (private ctx: DataContext, private currentProject: ProjectDataSource) {}

  static CHILD_PROCESS_FILE_PATH = path.join(__dirname, '../../../server/lib/util', 'require_async_child.js')

  killChildProcess () {
    this.ctx.update((o) => {
      if (o.currentProject?.configChildProcess) {
        o.currentProject.configChildProcess.process.kill()
      }
    })
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
    const dfd = pDefer<Cypress.ConfigOptions>()

    return {
      child,
      ipc: this.wrapConfigProcess(child, dfd),
      configPromise: dfd.promise,
    }
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
      child.kill()

      const err = this.ctx._apis.projectApi.error(type, ...args)

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
