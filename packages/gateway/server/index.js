require('@packages/coffee/register')

const debug = require('debug')('gateway')

const Promise = require('bluebird')
const _ = require('lodash')
const express = require('express')

const firefox = require('../../server/lib/browsers/firefox.coffee')


const startServer = (config) => {
  const app = express()
  const server = require('http').createServer(app)
  const io = require('socket.io')(server)
  const listenAsync = Promise.promisify(server.listen, { context: server })

  debug('starting server with config', config)
  io.set('transports', ['websocket'])

  io.on('connection', function (socket) {
    debug('socket connected')

    socket.on('command', (payload, cb) => {
      debug('got command', payload)
      return send(_.defaults(payload, { sessionId: config.sessionId }))
      .then((resp) => cb({ response: resp }))
      .catch((err) => {
        debug('command error', err)
        cb({ error: 'error' }) //errors.clone(err) }))
      })
    })
  })

  return listenAsync(3000)
}

const send = (data) => {
  debug('send', (data))
  return firefox.send(data)
}

firefox.open('firefox', 'about:blank')
.then(({ sessionId }) => {
  return startServer({ sessionId })
  .then(() => {
    return require('../server/static').start()
  })
  .then(() => {
    return send({
      name: 'WebDriver:Navigate',
      sessionId,
      parameters: { url: 'http://localhost:3001' },
    })
  })
})

module.exports = {
  startServer,
}

// EXAMPLE COMMAND

// socket.emit('command', {
// name: 'WebDriver:Navigate',
// parameters: { url: 'http://example.com' },
// }, console.log)
