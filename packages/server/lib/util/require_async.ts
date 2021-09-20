import _ from 'lodash'
import * as path from 'path'
import * as cp from 'child_process'
import * as inspector from 'inspector'
import * as util from '../plugins/util'
import * as errors from '../errors'
import { fs } from '../util/fs'
import Debug from 'debug'

const debug = Debug('cypress:server:require_async')

let requireProcess: cp.ChildProcess | null

interface RequireAsyncOptions{
  projectRoot: string
  loadErrorCode: string
  /**
   * members of the object returned that are functions and will need to be wrapped
   */
  functionNames: string[]
}

interface ChildOptions{
  stdio: 'inherit'
  execArgv?: string[]
}

const killChildProcess = () => {
  requireProcess && requireProcess.kill()
  requireProcess = null
}

export async function requireAsync (filePath: string, options: RequireAsyncOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    if (requireProcess) {
      debug('kill existing config process')
      killChildProcess()
    }

    if (/\.json$/.test(filePath)) {
      fs.readJson(path.resolve(options.projectRoot, filePath)).then((result) => resolve(result)).catch(reject)
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

    const childArguments = ['--projectRoot', options.projectRoot, '--file', filePath]

    debug('fork child process', path.join(__dirname, 'require_async_child.js'), childArguments, childOptions)
    requireProcess = cp.fork(path.join(__dirname, 'require_async_child.js'), childArguments, childOptions)
    const ipc = util.wrapIpc(requireProcess)

    if (requireProcess.stdout && requireProcess.stderr) {
      // manually pipe plugin stdout and stderr for dashboard capture
      // @see https://github.com/cypress-io/cypress/issues/7434
      requireProcess.stdout.on('data', (data) => process.stdout.write(data))
      requireProcess.stderr.on('data', (data) => process.stderr.write(data))
    }

    ipc.on('loaded', (result) => {
      debug('resolving with result %o', result)
      resolve(result)
    })

    ipc.on('load:error', (type, ...args) => {
      debug('load:error %s, rejecting', type)
      killChildProcess()

      const err = errors.get(type, ...args)

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
