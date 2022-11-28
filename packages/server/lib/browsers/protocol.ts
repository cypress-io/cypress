import { connect } from '@packages/network'
import Bluebird from 'bluebird'
import type { Socket } from 'net'
import utils from './utils'
const errors = require('../errors')

export function _getDelayMsForRetry (i, browserName) {
  if (i < 10) {
    return 100
  }

  if (i < 18) {
    return 500
  }

  if (i < 63) { // after 5 seconds, begin logging and retrying
    errors.warning('CDP_RETRYING_CONNECTION', i, browserName)

    return 1000
  }

  return
}

export function _connectAsync (opts) {
  return Bluebird.fromCallback((cb) => {
    connect.createRetryingSocket(opts, cb)
  })
  .then((sock) => {
    // can be closed, just needed to test the connection
    (sock as Socket).end()
  })
}

export async function getRemoteDebuggingPort () {
  const port = Number(process.env.CYPRESS_REMOTE_DEBUGGING_PORT) || await utils.getPort()

  return port
}
