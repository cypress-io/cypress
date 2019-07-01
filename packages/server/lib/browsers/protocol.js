const _ = require('lodash')
const CRI = require('chrome-remote-interface')
const promiseRetry = require('promise-retry')
const Promise = require('bluebird')
const net = require('net')
const la = require('lazy-ass')
const is = require('check-more-types')
const debug = require('debug')('cypress:server:protocol')

function connectAsync (opts) {
  return new Promise(function (resolve, reject) {
    let socket = net.connect(opts)

    socket.once('connect', function () {
      socket.removeListener('error', reject)
      resolve(socket)
    })
    socket.once('error', function (err) {
      socket.removeListener('connection', resolve)
      reject(err)
    })
  })
}

/**
 * Waits for the port to respond with connection to Chrome Remote Interface
 * @param {number} port Port number to connect to
 * @param {string} title Expected page title
 */
const getWsTargetFor = (port, title) => {
  la(is.port(port), 'expected port number', port)
  la(is.unemptyString(title), 'invalid page title', title)

  return promiseRetry(
    (retry) => {
      return connectAsync({ port }).catch(retry)
    },
    { retries: 10 }
  )
  .catch(() => {
    debug('retry connecting to debugging port %d', port)
  })
  .then(() => {
    return CRI.List()
  })
  .then((targets) => {
    debug('CRI list %o', targets)
    // activate the first available id

    // find the first target page that's a real tab
    // and not the dev tools
    const target = _.find(targets, (t) => {
      // return t.type === 'page' && t.url.startsWith('http')
      // return t.type === 'page' && t.title === title
      return t.type === 'page' && t.url === 'chrome://newtab/'
    })

    la(target, 'could not find CRI target')
    debug('found CRI target %o', target)

    return target.webSocketDebuggerUrl
  })
}

module.exports = {
  getWsTargetFor,
}
