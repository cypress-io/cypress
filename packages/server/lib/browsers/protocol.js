const _ = require('lodash')
const R = require('ramda')
const CRI = require('chrome-remote-interface')
const { connect } = require('@packages/network')
const errors = require('../errors')
const Promise = require('bluebird')
const la = require('lazy-ass')
const is = require('check-more-types')
const debug = require('debug')('cypress:server:protocol')

function _getDelayMsForRetry (i) {
  if (i < 10) {
    return 100
  }

  if (i < 18) {
    return 500
  }

  if (i < 33) { // after 5 seconds, begin logging and retrying
    errors.warning('CDP_RETRYING_CONNECTION', i)

    return 1000
  }
}

function _connectAsync (opts) {
  return Promise.fromCallback((cb) => {
    connect.createRetryingSocket(opts, cb)
  })
  .then((sock) => {
    // can be closed, just needed to test the connection
    sock.end()
  })
  .catch((err) => {
    errors.throw('CDP_COULD_NOT_CONNECT', opts.port, err)
  })
}

/**
 * Tries to find the starting page (probably blank tab)
 * among all targets returned by CRI.List call.
 *
 * @returns {string} web socket debugger url
 */
const findStartPage = (newTabTargetFields) => {
  return (targets) => {
    debug('CRI List %o', { numTargets: targets.length, targets })

    const target = _.find(targets, newTabTargetFields)

    la(target, 'could not find CRI target')

    debug('found CRI target %o', target)

    return target
  }
}

const findStartPageTarget = (connectOpts) => {
  debug('find target options %o', connectOpts)
  la(connectOpts.newTabTargetFields, 'missing new tab target props to look for', connectOpts)

  // what happens if the next call throws an error?
  // it seems to leave the browser instance open
  // need to clone connectOpts, CRI modifies it
  return CRI.List(_.clone(connectOpts))
  .then(findStartPage(connectOpts.newTabTargetFields))
  .then(R.prop('webSocketDebuggerUrl'))
}

/**
 * Waits for the port to respond with connection to Chrome Remote Interface
 * @param {number} port Port number to connect to
 * @param {Object} newTabTargetFields properties of new tab to find it by among CRI targets
 */
const getWsTargetFor = (port, newTabTargetFields) => {
  debug('Getting WS connection to CRI on port %d', port)
  la(is.port(port), 'expected port number', port)

  let retryIndex = 0

  // force ipv4
  // https://github.com/cypress-io/cypress/issues/5912
  const connectOpts = {
    host: '127.0.0.1',
    port,
    newTabTargetFields,
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

        return Promise.delay(delay)
        .then(retry)
      })
    }

    return retry()
  })
  .tapCatch((err) => {
    debug('failed to connect to CDP %o', { connectOpts, err })
  })
}

module.exports = {
  _connectAsync,
  _getDelayMsForRetry,
  getWsTargetFor,
}
