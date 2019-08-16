const path = require('path')
const http = require('http')
const net = require('net')

const _ = require('lodash')
const Promise = require('bluebird')
const { spawn } = require('child_process')
const request = require('request-promise')
const promiseRetry = require('promise-retry')
const normalizer = require('header-case-normalizer')

const debug = require('debug')('cypress:launcher')
// const gateway = require('@packages/gateway')
// const urlUtil = require('url')
// const exePath = require('iedriver').path32

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

const open = (name, url, options = {}, automation) => {

  const invoke = (method, data) => {
    return Promise.resolve(null)
  }

  automation.use({
    onRequest (message, data) {
      switch (message) {
        case 'get:cookies':
          return invoke('getCookies', data)
        case 'get:cookie':
          return invoke('getCookie', data)
        case 'set:cookie':
          return invoke('setCookie', data)
        case 'clear:cookies':
          return invoke('clearCookies', data)
        case 'clear:cookie':
          return invoke('clearCookie', data)
        case 'is:automation:client:connected':
          return true
          // return invoke('isAutomationConnected', data)
        case 'take:screenshot':
          return invoke('takeScreenshot')
        default:
          throw new Error(`No automation handler registered for: '${message}'`)
      }
    },
  })

  const sessionRequest = {
    desiredCapabilities: {
      browserName: 'internet explorer',
    },
  }

  const pacUrl = options.pacUrl
  const proxyUrl = options.proxyUrl

  if (pacUrl) {
    _.extend(sessionRequest.desiredCapabilities, {
      'ie.usePerProcessProxy': true,
      proxy: {
        proxyType: 'manual', //'pac',
        // proxyAutoconfigUrl: pacUrl,
        httpProxy: proxyUrl,
        sslProxy: proxyUrl,
        // // Pass url of gateway server running on host machine
        noProxy: ['<-loopback>'], //;localhost: 8445],
      },
    })
  }

  const driver = spawn(path.resolve(__dirname, '../../IEDriverServer.exe'), //exePath,
    [
      // '--log-level=TRACE',
    ],
    { stdio: 'pipe' })

  // driver.stdout.pipe(logFile)
  // driver.stderr.pipe(logFile)
  driver.stdout.on('data', (data) => {
  })

  driver.stderr.on('data', (data) => {
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
    sessionId = res.value.sessionId
  })
  .then(() => {
    return request({
      uri: `http://localhost:5555/session/${sessionId}/url`,
      method: 'POST',
      body: { url },
      json: true,
    })
  })
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
