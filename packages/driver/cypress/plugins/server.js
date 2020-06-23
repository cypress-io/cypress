const fs = require('fs')
const auth = require('basic-auth')
const bodyParser = require('body-parser')
const express = require('express')
const http = require('http')
const path = require('path')
const Promise = require('bluebird')

const PATH_TO_SERVER_PKG = path.dirname(require.resolve('@packages/server'))
const ports = [3500, 3501]

ports.forEach((port) => {
  const app = express()
  const server = http.Server(app)

  app.set('port', port)

  app.set('view engine', 'html')

  app.use(require('cors')())
  app.use(require('compression')())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use(require('method-override')())

  app.head('/', (req, res) => {
    return res.sendStatus(200)
  })

  app.get('/timeout', (req, res) => {
    return Promise
    .delay(req.query.ms || 0)
    .then(() => {
      return res.send('<html><body>timeout</body></html>')
    })
  })

  // allows us to serve the testrunner into an iframe for testing
  app.use('/isolated-runner', express.static(path.join(__dirname, '../../../runner/dist')))

  app.get('/node_modules/*', (req, res) => {
    return res.sendFile(path.join('node_modules', req.params[0]), {
      root: path.join(__dirname, '../..'),
    })
  })

  app.get('/xml', (req, res) => {
    return res.type('xml').send('<foo>bar</foo>')
  })

  app.get('/arraybuffer', (req, res) => {
    return fs.readFile(path.join(PATH_TO_SERVER_PKG, 'test/support/fixtures/sample.pdf'), (err, bytes) => {
      if (err) {
        return res.status(500).send(err.stack)
      }

      res.type('pdf')

      return res.send(bytes)
    })
  })

  app.get('/basic_auth', (req, res) => {
    const user = auth(req)

    if (user && ((user.name === 'cypress') && (user.pass === 'password123'))) {
      return res.send('<html><body>basic auth worked</body></html>')
    }

    return res
    .set('WWW-Authenticate', 'Basic')
    .sendStatus(401)
  })

  app.get('/json-content-type', (req, res) => {
    return res.send({})
  })

  app.get('/invalid-content-type', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8,text/html')

    return res.end('<html><head><title>Test</title></head><body><center>Hello</center></body></html>')
  })

  app.get('/undefined-content-type', (req, res) => {
    return res.end('<html>some stuff that looks like<span>html</span></html>')
  })

  app.all('/dump-method', (req, res) => {
    return res.send(`<html><body>request method: ${req.method}</body></html>`)
  })

  app.all('/dump-qs', (req, res) => {
    return res.send(`<html><body>it worked!<br>request querystring:<br>${JSON.stringify(req.query)}</body></html>`)
  })

  app.post('/post-only', (req, res) => {
    return res.send(`<html><body>it worked!<br>request body:<br>${JSON.stringify(req.body)}</body></html>`)
  })

  app.get('/dump-headers', (req, res) => {
    return res.send(`<html><body>request headers:<br>${JSON.stringify(req.headers)}</body></html>`)
  })

  app.get('/status-404', (req, res) => {
    return res
    .status(404)
    .send('<html><body>not found</body></html>')
  })

  app.get('/status-500', (req, res) => {
    return res
    .status(500)
    .send('<html><body>server error</body></html>')
  })

  app.use(express.static(path.join(__dirname, '..')))

  app.use(require('errorhandler')())

  return server.listen(app.get('port'), () => {
    // eslint-disable-next-line no-console
    return console.log('Express server listening on port', app.get('port'))
  })
})
