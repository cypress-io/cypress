require('graceful-fs').gracefulify(require('fs'))
const debug = require('debug')('cypress:server:require_async:child')
const tsNodeUtil = require('./ts_node')
const util = require('../plugins/util')
const ipc = util.wrapIpc(process)

require('./suppress_warnings').suppress()

const { file, projectRoot, loadErrorCode } = require('minimist')(process.argv.slice(2))

let tsRegistered = false

run(ipc, file, projectRoot)

/**
 * runs and returns the passed `requiredFile` file in the ipc `load` event
 * @param {*} ipc Inter Process Comunication protocol
 * @param {*} requiredFile the file we are trying to load
 * @param {*} projectRoot the root of the typescript project (useful mainly for tsnode)
 * @returns
 */
function run (ipc, requiredFile, projectRoot) {
  debug('requiredFile:', requiredFile)
  debug('projectRoot:', projectRoot)
  if (!projectRoot) {
    throw new Error('Unexpected: projectRoot should be a string')
  }

  if (!tsRegistered) {
    tsNodeUtil.register(projectRoot, requiredFile)

    // ensure typescript is only registered once
    tsRegistered = true
  }

  process.on('uncaughtException', (err) => {
    debug('uncaught exception:', util.serializeError(err))
    ipc.send('error', util.serializeError(err))

    return false
  })

  process.on('unhandledRejection', (event) => {
    const err = (event && event.reason) || event

    debug('unhandled rejection:', util.serializeError(err))
    ipc.send('error', util.serializeError(err))

    return false
  })

  try {
    const exp = require(requiredFile)

    const result = exp.default || exp

    ipc.send('loaded', result)

    debug('config %o', result)
  } catch (err) {
    debug('failed to load requiredFile:\n%s', err.stack)
    ipc.send('load:error', loadErrorCode, requiredFile, err.stack)

    return
  }
}
