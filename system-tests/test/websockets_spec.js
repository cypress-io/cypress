const ws = require('ws')

const systemTests = require('../lib/system-tests').default

const onServer = (app) => {
  return app.get('/foo', (req, res) => {
    return res.send('<html>foo></html>')
  })
}

const onWsServer = function (app, server) {
  const wss = new ws.Server({ server })

  return wss.on('connection', (ws) => {
    return ws.on('message', (msg) => {
      return ws.send(`${msg}bar`)
    })
  })
}

const onWssServer = function (app) {}

describe('e2e websockets', () => {
  systemTests.setup({
    servers: [{
      port: 3038,
      static: true,
      onServer,
    }, {
      port: 3039,
      onServer: onWsServer,
    }, {
      port: 3040,
      onServer: onWssServer,
    }],
  })

  // https://github.com/cypress-io/cypress/issues/556
  systemTests.it('passes', {
    browser: '!webkit', // TODO(webkit): fix+unskip
    spec: 'websockets.cy.js',
    snapshot: true,
  })
})
