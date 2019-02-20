const _ = require('lodash')
const CRI = require('chrome-remote-interface')
const promiseRetry = require('promise-retry')
const Promise = require('bluebird')
const net = require('net')
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

// TODO: accept port as arg
const getWsTargetFor = () => {

  return promiseRetry((retry) => {
    return connectAsync({ port: '9222' }).catch(retry)
  }, { retries: 10 })
  .catch(() => {
    debug('retry connecting to debugging port')
  })
  .then(() => {
    return CRI.List()
  })
  .then((targets) => {
    // activate the first available id

    // find the first target page that's a real tab
    // and not the dev tools
    const target = _.find(targets, (t) => {
      return t.type === 'page' && t.url.startsWith('http')
    })

    return target.webSocketDebuggerUrl
  })
}

module.exports = {
  getWsTargetFor,
}
