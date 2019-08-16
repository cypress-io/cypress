// require('@packages/coffee/register')

// const debug = require('debug')('gateway')

// const Promise = require('bluebird')
const request = require('request-promise')

const proxyServer = require('./proxy')

const start = (send, sessionId) => {
  return proxyServer.start(send)
  .then(() => require('./static').start())
  .then(() => {
    return request({
      uri: `http://localhost:5555/session/${sessionId}/url`,
      method: 'POST',
      body: { url: 'http://localhost:3001' },
      json: true,
    })
  })
}

module.exports = {
  start,
}

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
