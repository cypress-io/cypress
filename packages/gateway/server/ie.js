require('@packages/coffee/register')

const debug = require('debug')('gateway')

const Promise = require('bluebird')
const request = require('request-promise')
const { spawn } = require('child_process')
const net = require('net')
const promiseRetry = require('promise-retry')
const http = require('http')
const normalizer = require('header-case-normalizer')

const iedriver = require('iedriver')

const proxyServer = require('./proxy')

const setHeader = http.OutgoingMessage.prototype.setHeader

http.OutgoingMessage.prototype.setHeader = function (name, value) {
  return setHeader.call(this, normalizer(name), value)
}


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

let sessionId

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

const driver = spawn(iedriver.path32, ['--log-level=TRACE'], { stdio: 'pipe' })

const killBrowser = () => {
  return request({
    uri: `http://localhost:5555/session/${sessionId}`,
    method: 'DELETE',
  })
}
process.stdin.on('data', () => {
  killBrowser().then(() => process.exit(0))
})

const sessionRequest = {
  desiredCapabilities: {
    browserName: 'internet explorer',
  },
}

promiseRetry((retry) => connectAsync({ port: '5555' }).catch(retry))
.then(() => {
  return request({
    uri: 'http://localhost:5555/session',
    method: 'POST',
    body: sessionRequest,
    json: true,
  })
})
.then((res) => {
  debug('WD:RESPONSE', res)
  sessionId = res.value.sessionId
})
.then(() => proxyServer.start(send))
.then(() => require('./static').start())
.then(() => request({
  uri: `http://localhost:5555/session/${sessionId}/url`,
  method: 'POST',
  body: { url: 'http://localhost:3001' },
  json: true,
}))

// firefox.open('firefox', 'about:blank')
// .then(({ sessionId }) => {
//   return startServer({ sessionId })
//   .then(() => {
//     return require('../server/static').start()
//   })
//   .then(() => {
//     return send({
//       name: 'WebDriver:Navigate',
//       sessionId,
//       parameters: { url: 'http://localhost:3001' },
//     })
//   })
// })

// module.exports = {
//   startServer,
// }

// EXAMPLE COMMAND

// socket.emit('command', {
// name: 'WebDriver:Navigate',
// parameters: { url: 'http://example.com' },
// }, console.log)

/*

socket.emit('command', {
  actions: [{
    'type': 'pointer',
    'id': 'finger1',
    parameters: {
      pointerType: 'mouse',
    },
    actions: [
      { type: 'pointerDown', x: 0, y: 0, button: 0 },
      { type: 'pointerUp', x: 0, y: 0, button: 0 },
    ],
  }],
}
  , console.log)

  */


