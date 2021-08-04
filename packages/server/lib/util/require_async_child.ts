import { gracefulify } from 'graceful-fs'
import * as fs from 'fs'
import Debug from 'debug'
import * as tsNodeUtil from './ts_node'
import { wrapIpc, serializeError } from '../plugins/util'
import { suppress } from './suppress_warnings'

const ipc = wrapIpc(process as any)
const debug = Debug('cypress:server:require_async:child')

gracefulify(fs)
suppress()

const { file, projectRoot, loadErrorCode } = require('minimist')(process.argv.slice(2))

let tsRegistered = false

run(ipc, file, projectRoot)

/**
 * Runs and returns the passed `requiredFile` file in the ipc `load` event
 * @param {*} ipc Inter Process Comunication protocol
 * @param {string} requiredFile the file we are trying to load
 * @param {string} projectRoot the root of the typescript project (useful mainly for tsnode)
 * @returns
 */
function run (ipc, requiredFile: string, projectRoot: string) {
  debug('requiredFile:', requiredFile)
  debug('projectRoot:', projectRoot)
  if (!projectRoot) {
    throw new Error('Unexpected: projectRoot should be a string')
  }

  if (!tsRegistered) {
    debug('register typescript for required file')
    tsNodeUtil.register(projectRoot, requiredFile)

    // ensure typescript is only registered once
    tsRegistered = true
  }

  process.on('uncaughtException', (err) => {
    debug('uncaught exception:', serializeError(err))
    ipc.send('error', serializeError(err))

    return false
  })

  process.on('unhandledRejection', (event?: {reason: string}) => {
    const err = (event && event.reason) || event

    debug('unhandled rejection:', serializeError(err))
    ipc.send('error', serializeError(err))

    return false
  })

  ipc.on('load', () => {
    try {
      debug('try loading', requiredFile)
      const exp = require(requiredFile) as any

      const result = exp.default || exp

      ipc.send('loaded', result)

      debug('config %o', result)
    } catch (err) {
      debug('failed to load requiredFile:\n%s', err.code, err.stack)
      if (err.code === 'ENOENT' || err.code === 'MODULE_NOT_FOUND') {
        ipc.send('load:error', err.code, requiredFile, err.stack)

        return
      }

      ipc.send('load:error', loadErrorCode, requiredFile, err.stack)

      return
    }
  })
}
