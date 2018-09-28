const exePath = require('iedriver').path32
const { spawn } = require('child_process')
const net = require('net')
const promiseRetry = require('promise-retry')
const debug = require('debug')('cypress:launcher')
const request = require('request-promise')
// const gateway = require('@packages/gateway')
const http = require('http')
const normalizer = require('header-case-normalizer')
const urlUtil = require('url')
const _ = require('lodash')

const setHeader = http.OutgoingMessage.prototype.setHeader

http.OutgoingMessage.prototype.setHeader = function (name, value) {
  return setHeader.call(this, normalizer(name), value)
}


function connectPromise (opts) {
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

let sessionId

const open = (name, url, options = {}) => {
  const sessionRequest = {
    desiredCapabilities: {
      browserName: 'internet explorer',
    },
  }

  const ps = options.proxyServer
  if (ps) {
    console.log('ps equals:', ps)
    let { hostname, port, protocol } = urlUtil.parse(ps)
    port = port || (protocol === 'https:' ? '443' : '80')
    const addr = `${hostname}:${port}`
    _.extend(sessionRequest.desiredCapabilities, {
      // 'ie.usePerProcessProxy': true,
      proxy: {
        proxyType: 'manual',
        httpProxy: addr,
        sslProxy: addr,
        // Pass url of gateway server running on host machine
        noProxy: ['localhost:8445', '<-loopback>'], //;localhost: 8445],
      },
    })
  }


  console.log(sessionRequest.desiredCapabilities)
  const driver = spawn(exePath,
    [
      '--log-level=TRACE',
    ],
    { stdio: 'pipe' })

  driver.stdout.on('data', (data) => {
    console.log(data.toString())
  })
  driver.stderr.on('data', (data) => {
    console.log(data.toString())
  })

  return promiseRetry((retry) => connectPromise({ port: '5555' }).catch(retry))
  .then(() => {
    return request({
      uri: 'http://localhost:5555/session',
      method: 'POST',
      body: sessionRequest,
      json: true,
    })
  })
  .then((res) => {
    console.log('WD:RESPONSE', res)
    console.log('WD:RESPONSE', res.value.capabilities.proxy)
    sessionId = res.value.sessionId
  })
  .then(() => request({
    uri: `http://localhost:5555/session/${sessionId}/url`,
    method: 'POST',
    body: { url },
    json: true,
  }))
}


const send = (data) => {
  debug('send', (data))
  // return send(data)
  if (!sessionId) throw new Error('sessionId is falsey')
  return request({
    uri: `http://localhost:5555/session/${sessionId}/actions`,
    method: 'POST',
    body: data,
    json: true,
  })
}


// const killBrowser = () => {
//   return request({
//     uri: `http://localhost:5555/session/${sessionId}`,
//     method: 'DELETE',
//   })
// }

// http://localhost:3500/__/#/tests/integration\commands\actions\check_spec.coffee

module.exports = {
  open,
  send,
}
