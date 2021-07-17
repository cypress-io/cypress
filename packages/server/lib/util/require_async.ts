import _ from 'lodash'
import * as path from 'path'
import * as cp from 'child_process'
import * as inspector from 'inspector'
import * as util from '../plugins/util'
import * as errors from '../errors'
import Debug from 'debug'

const debug = Debug('cypress:server:require_async')

let configProcess: cp.ChildProcess

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

export default async function requireAsync (filePath: string, options: RequireAsyncOptions): Promise<any> {
  if (configProcess) {
    debug('kill existing config process')
    configProcess.kill()
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

  const childArguments = ['--projectRoot', options.projectRoot, '--file', filePath, '--loadErrorCode', options.loadErrorCode]

  debug('fork child process', path.join(__dirname, 'require_async_child.js'), childArguments, childOptions)
  configProcess = cp.fork(path.join(__dirname, 'require_async_child.js'), childArguments, childOptions)
  const ipc = util.wrapIpc(configProcess)

  return new Promise((resolve, reject) => {
    ipc.on('loaded', ({ result, functionNames }) => {
      debug('resolving with result %o', result)
      debug('resolving with functions %o', functionNames)
      configProcess.kill()
      resolve({ result, functionNames })
    })

    ipc.on('load:error', (type, ...args) => {
      debug('load:error %s, rejecting', type)
      configProcess.kill()

      reject(errors.get(type, ...args))
    })

    debug('trigger the load of the file')
    ipc.send('load', options.functionNames)
  })
}
