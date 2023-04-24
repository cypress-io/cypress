import cors from 'cors'
import serverTiming from 'server-timing'
import systemTests from '../lib/system-tests'

const onServer = function (app) {
  app.use(cors())
  app.use(serverTiming())
  app.use((req, res, next) => {
    console.log(req.socket.id, res.socket.id)
    res.socket.setKeepAlive(true, 0)
    res.setMetric('socketId', req.socket.id)

    next()
  })

  app.get('/', (req, res) => {
    res.send('<html><h1>hi</h1></html>')
  })

  app.get('/delay', (req, res) => {
    setTimeout(() => {
      res.sendStatus(200)
    }, req.query.ms)
  })

  app.get('/dev', (req, res) => {
    setTimeout(() => {
      res.sendStatus(200)
    }, req.query.ms)
  })
}

describe('e2e proxy perf', () => {
  systemTests.setup({
    servers: [{
      onServer,
      port: 3500,
      https: true,
    }, {
      onServer,
      port: 3501,
      https: true,
    }],
    settings: {
      e2e: {},
      hosts: {
        '*.foo.com': '127.0.0.1',
        '*.bar.net': '127.0.0.1',
        '*.cypress.test': '127.0.0.1',
      },
    },
  })

  systemTests.it('passes', {
    project: 'proxy-perf',
    browser: 'chrome',
    spec: 'proxy-perf.cy.js',
    snapshot: false,
    config: {
      supportFile: false,
      testIsolation: false,
      // videoCompression: false,
      // responseTimeout: 1000,
    },
  })
})
