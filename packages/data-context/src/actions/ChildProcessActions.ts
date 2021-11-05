import type { DataContext } from '..'
import EE from 'events'
import cp, { ChildProcess } from 'child_process'
import Debug from 'debug'
import inspector from 'inspector'
import _ from 'lodash'

const debug = Debug('cypress:server:require_async')

interface ChildOptions{
  stdio: 'inherit'
  execArgv?: string[]
}

export class ChildProcessActions {
  constructor (protected ctx: DataContext) {
  }

  protected killChildProcess () {
    if (this.ctx.activeProject?.configChildProcess?.process) {
      this.ctx.activeProject.configChildProcess?.process.kill()
      this.ctx.activeProject.configChildProcess.process = null
    }
  }

  fork (filePath: string, childProcessFilePath: string) {
    return new Promise((resolve, reject) => {
      if (!this.ctx.activeProject) {
        reject('Can\'t require a fork a process without an active project')

        return
      }

      // If there's an active process, kill it before forking a new one.
      if (this.ctx.activeProject?.configChildProcess.process) {
        debug('kill existing fork process')
        this.killChildProcess()
      }

      const childOptions: ChildOptions = {
        stdio: 'inherit',
      }

      if (inspector.url()) {
        childOptions.execArgv = _.chain(process.execArgv.slice(0))
        .remove('--inspect-brk')
        .push(`--inspect=${process.debugPort + 1}`)
        .value()
      }

      const childArguments = ['--projectRoot', this.ctx.activeProject.projectRoot, '--file', filePath]

      debug('fork child process', childProcessFilePath, childArguments, childOptions)
      this.ctx.activeProject.configChildProcess.process = cp.fork(childProcessFilePath, childArguments, childOptions)

      const ipc = this.wrapIpc(this.ctx.activeProject.configChildProcess.process)

      if (this.ctx.activeProject.configChildProcess.process.stdout && this.ctx.activeProject.configChildProcess.process.stderr) {
        // manually pipe plugin stdout and stderr for dashboard capture
        // @see https://github.com/cypress-io/cypress/issues/7434
        this.ctx.activeProject.configChildProcess.process.stdout.on('data', (data) => process.stdout.write(data))
        this.ctx.activeProject.configChildProcess.process.stderr.on('data', (data) => process.stderr.write(data))
      }

      ipc.on('loaded', (result) => {
        debug('resolving with result %o', result)
        resolve(result)
      })

      ipc.on('load:error', (type, ...args) => {
        debug('load:error %s, rejecting', type)
        this.killChildProcess()

        const err = this.ctx._apis.projectApi.error.get(type, ...args)

        // if it's a non-cypress error, restore the initial error
        if (!(err.message?.length)) {
          err.isCypressErr = false
          err.message = args[1]
          err.code = type
          err.name = type
        }

        reject(err)
      })

      debug('trigger the load of the file')
      ipc.send('load')
    })
  }

  protected serializeError (err: Error) {
    return _.pick(err, 'name', 'message', 'stack', 'code', 'annotated', 'type')
  }

  protected wrapIpc (aProcess: ChildProcess) {
    const emitter = new EE()

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
