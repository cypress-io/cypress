import _ from 'lodash'
import CRI from 'chrome-remote-interface'
import { connect } from '@packages/network'
import Bluebird from 'bluebird'
import la from 'lazy-ass'
import Debug from 'debug'
import { Socket } from 'net'
const errors = require('../errors')
const is = require('check-more-types')

const debug = Debug('cypress:server:browsers:protocol')

export function _getDelayMsForRetry (i) {
  if (i < 10) {
    return 100
  }

  if (i < 18) {
    return 500
  }

  if (i < 63) { // after 5 seconds, begin logging and retrying
    errors.warning('CDP_RETRYING_CONNECTION', i)

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

/**
 * Tries to find the starting page (probably blank tab)
 * among all targets returned by CRI.List call.
 *
 * @returns {string} web socket debugger url
 */
const findStartPage = (targets) => {
  debug('CRI List %o', { numTargets: targets.length, targets })
  // activate the first available id
  // find the first target page that's a real tab
  // and not the dev tools or background page.
  // since we open a blank page first, it has a special url
  const newTabTargetFields = {
    type: 'page',
    url: 'about:blank',
  }

  const target = _.find(targets, newTabTargetFields)

  la(target, 'could not find CRI target')

  debug('found CRI target %o', target)

  return target.webSocketDebuggerUrl
}

const findStartPageTarget = (connectOpts) => {
  debug('CRI.List %o', connectOpts)

  // what happens if the next call throws an error?
  // it seems to leave the browser instance open
  // need to clone connectOpts, CRI modifies it
  return CRI.List(_.clone(connectOpts)).then(findStartPage)
}

/**
 * Waits for the port to respond with connection to Chrome Remote Interface
 * @param {number} port Port number to connect to
 */
export const getWsTargetFor = (port) => {
  debug('Getting WS connection to CRI on port %d', port)
  la(is.port(port), 'expected port number', port)

  let retryIndex = 0

  // force ipv4
  // https://github.com/cypress-io/cypress/issues/5912
  const connectOpts = {
    host: '127.0.0.1',
    port,
    getDelayMsForRetry: (i) => {
      retryIndex = i

      return _getDelayMsForRetry(i)
    },
  }

  return _connectAsync(connectOpts)
  .then(() => {
    const retry = () => {
      debug('attempting to find CRI target... %o', { retryIndex })

      return findStartPageTarget(connectOpts)
      .catch((err) => {
        retryIndex++
        const delay = _getDelayMsForRetry(retryIndex)

        debug('error finding CRI target, maybe retrying %o', { delay, err })

        if (typeof delay === 'undefined') {
          throw err
        }

        return Bluebird.delay(delay)
        .then(retry)
      })
    }

    return retry()
  })
  .catch((err) => {
    debug('failed to connect to CDP %o', { connectOpts, err })
    errors.throw('CDP_COULD_NOT_CONNECT', port, err)
  })
}
