require('@packages/coffee/register')
const debug = require('debug')('gateway')
const _ = require('lodash')
const firefox = require('../../server/lib/browsers/firefox.coffee')
const proxyServer = require('./proxy')

let sessionId

const send = (data) => {
  debug('send %O', (data))
  _.defaults(data, { sessionId })

  return firefox.send(data)
}

firefox.open('firefox', 'about:blank')
.then((res) => {
  debug(res)
  sessionId = res.sessionId

  return proxyServer.start(send)
})
.then(() => {
  return require('../server/static').start()
})
.then(() => {
  return send({
    name: 'WebDriver:Navigate',
    parameters: { url: 'http://localhost:3001' },
  })
})

// EXAMPLE COMMAND

// socket.emit('command', {
// name: 'WebDriver:Navigate',
// parameters: { url: 'http://example.com' },
// }, console.log)
