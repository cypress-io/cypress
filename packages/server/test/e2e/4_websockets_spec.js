const ws = require('ws')

const e2e = require('../support/helpers/e2e').default

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
  e2e.setup({
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
  e2e.it('passes', {
    spec: 'websockets_spec.coffee',
    snapshot: true,
  })
})
