const fs = require('fs-extra')
const auth = require('basic-auth')
const bodyParser = require('body-parser')
const express = require('express')
const http = require('http')
const httpsProxy = require('@packages/https-proxy')
const path = require('path')
const Promise = require('bluebird')
const multer = require('multer')
const upload = multer({ dest: 'cypress/_test-output/' })
const { authCreds } = require('../fixtures/auth_creds')

const PATH_TO_SERVER_PKG = path.dirname(require.resolve('@packages/server'))

const httpPorts = [3500, 3501]
const httpsPorts = [3502, 3503]

const createApp = (port) => {
  const app = express()

  app.set('port', port)

  app.set('view engine', 'html')

  app.all('/no-cors', (req, res) => {
    res.end(req.method)
  })

  app.use(require('cors')())
  app.use(require('cookie-parser')())
  app.use(require('compression')())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use(bodyParser.raw())
  app.use(require('method-override')())

  app.head('/', (req, res) => {
    return res.sendStatus(200)
  })

  app.get('/', (req, res) => {
    return res.send('<html><body>root page</body></html>')
  })

  app.get('/timeout', (req, res) => {
    return Promise
    .delay(req.query.ms || 0)
    .then(() => {
      return res.send('<html><body>timeout</body></html>')
    })
  })

  app.get('/redirect-timeout', (req, res) => {
    return Promise
    .delay(100)
    .then(() => {
      return res.send('<html><body>timeout</body></html>')
    })
  })

  app.get('/custom-headers', (req, res) => {
    return res.set('x-foo', 'bar')
    .send('<html><body>hello there</body></html>')
  })

  app.get('/status-code', (req, res) => {
    res.sendStatus(req.query.code || 200)
  })

  app.all('/redirect', (req, res) => {
    if (req.query.chunked) {
      res.setHeader('transfer-encoding', 'chunked')
      res.removeHeader('content-length')
    }

    res.statusCode = Number(req.query.code || 301)
    res.setHeader('Location', req.query.href)
    res.end()
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

  app.get('/binary', (req, res) => {
    const uint8 = new Uint8Array(3)

    uint8[0] = 120
    uint8[1] = 42
    uint8[2] = 7

    res.setHeader('Content-Type', 'application/octet-stream')

    return res.send(Buffer.from(uint8))
  })

  app.post('/binary', (req, res) => {
    res.setHeader('Content-Type', 'application/octet-stream')

    return res.send(req.body)
  })

  app.get('*/1mb', (req, res) => {
    return res.type('text').send('X'.repeat(1024 * 1024))
  })

  app.get('/basic_auth', (req, res) => {
    const user = auth(req)

    if (user?.name === authCreds.username && user?.pass === authCreds.password) {
      return res.send('<html><body>basic auth worked</body></html>')
    }

    return res
    .set('WWW-Authenticate', 'Basic')
    .type('html')
    .sendStatus(401)
  })

  app.get('/json-content-type', (req, res) => {
    res.setHeader('content-type', req.query.contentType || 'application/json')

    return res.end('{}')
  })

  app.get('/html-content-type-with-charset-param', (req, res) => {
    res.setHeader('Content-Type', 'text/html;charset=utf-8')

    return res.end('<html><head><title>Test</title></head><body><center>Hello</center></body></html>')
  })

  app.get('/invalid-content-type', (req, res) => {
    res.setHeader('Content-Type', 'text/image; charset=utf-8')

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

  app.get('/verify-content-length-is-absent', (req, res) => {
    return res.send(req.headers['content-length'] === undefined)
  })

  app.get('/dump-headers', (req, res) => {
    return res.send(`<html><body>request headers:<br>${JSON.stringify(req.headers)}</body></html>`)
  })

  app.all('/dump-octet-body', (req, res) => {
    return res.send(`<html><body>it worked!<br>request body:<br>${req.body.toString()}</body></html>`)
  })

  app.all('/dump-form-data', upload.single('file'), (req, res) => {
    return res.send(`<html><body>it worked!<br>request body:<br>${JSON.stringify(req.body)}<br>original name:<br>${req.file.originalname}</body></html>`)
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

  app.get('/prelogin', (req, res) => {
    const { redirect, override } = req.query
    let cookie = 'prelogin=true'

    // if testing overridden cookies, need to make it cross-origin so it's
    // included in the cross-origin `/login` request
    if (override) {
      cookie += '; SameSite=None; Secure'
    }

    res
    .header('Set-Cookie', cookie)
    .redirect(302, redirect)
  })

  app.get('/cookie-login', (req, res) => {
    const { cookie, localhostCookie, username, redirect } = req.query

    res
    .header('Set-Cookie', decodeURIComponent(cookie))
    .redirect(302, `/verify-cookie-login?username=${username}&redirect=${redirect}&cookie=${localhostCookie}`)
  })

  const getUserCookie = (req) => {
    return req.cookies.user || req.cookies['__Host-user'] || req.cookies['__Secure-user']
  }

  app.get('/verify-cookie-login', (req, res) => {
    if (!getUserCookie(req)) {
      return res
      .send('<html><body><h1>Not logged in</h1></body></html>')
    }

    const { cookie, username, redirect } = req.query

    res.send(`
      <html>
        <body>
          <h1>Redirecting ${username}...</h1>
          <script>
            setTimeout(() => {
              window.location.href = '${redirect}?username=${username}&cookie=${cookie}'
            }, 500)
          </script>
        </body>
      </html>
    `)
  })

  app.get('/login', (req, res) => {
    const { cookie, username } = req.query

    if (!username) {
      return res.send('<html><body><h1>Must specify username to log in</h1></body></html>')
    }

    if (!req.cookies.prelogin) {
      return res.send('<html><body><h1>Social login failed</h1></body></html>')
    }

    const decodedCookie = decodeURIComponent(cookie)

    res
    .append('Set-Cookie', decodedCookie)
    .append('Set-Cookie', 'prelogin=verified')
    .redirect(302, '/welcome')
  })

  app.get('/logout', (req, res) => {
    res
    .header('Set-Cookie', 'user=')
    .redirect(302, '/welcome')
  })

  app.get('/welcome', (req, res) => {
    const user = getUserCookie(req)

    if (!user) {
      return res.send('<html><body><h1>No user found</h1></body></html>')
    }

    if (req.cookies.prelogin !== 'verified') {
      return res.send('<html><body><h1>Login not verified</h1></body></html>')
    }

    res.send(`<html><body><h1>Welcome, ${user}!</h1></body></html>`)
  })

  app.get('/test-request', (req, res) => {
    res.sendStatus(200)
  })

  app.get('/set-cookie', (req, res) => {
    const { cookie } = req.query

    res
    .append('Set-Cookie', cookie)
    .sendStatus(200)
  })

  app.get('/set-same-site-none-cookie-on-redirect', (req, res) => {
    const { redirect, cookie } = req.query
    const cookieDecoded = decodeURIComponent(cookie)

    const cookieVal = `${cookieDecoded}; SameSite=None; Secure`

    res
    .header('Set-Cookie', cookieVal)
    .redirect(302, redirect)
  })

  app.get('/test-request-credentials', (req, res) => {
    const { origin } = new URL(req.headers.referer)

    res
    .setHeader('Access-Control-Allow-Origin', origin)
    .setHeader('Access-Control-Allow-Credentials', 'true')
    .sendStatus(200)
  })

  app.get('/set-cookie-credentials', (req, res) => {
    const { cookie } = req.query
    const { origin } = new URL(req.headers.referer)

    res
    .setHeader('Access-Control-Allow-Origin', origin)
    .setHeader('Access-Control-Allow-Credentials', 'true')
    .append('Set-Cookie', cookie)
    .sendStatus(200)
  })

  let _var = ''

  app.get('/set-var', (req, res) => {
    _var = req.query.v
    res.sendStatus(200)
  })

  app.get('/get-var', (req, res) => {
    res.send(_var)
  })

  app.get('/download-basic-auth.csv', (req, res) => {
    const user = auth(req)

    if (user?.name === authCreds.username && user?.pass === authCreds.password) {
      return res.sendFile(path.join(__dirname, '..', 'fixtures', 'downloads_records.csv'))
    }

    return res
    .set('WWW-Authenticate', 'Basic')
    .type('html')
    .sendStatus(401)
  })

  app.post('/upload', (req, res) => {
    res.sendStatus(200)
  })

  app.get('/memory', (req, res) => {
    res.send(`
      <html>
        <body></body>
        <script>
          for (let i = 0; i < 100; i++) {
            const el = document.createElement('p')
            el.id = 'p' + i
            el.innerHTML = 'x'.repeat(100000)

            document.body.appendChild(el)
          }
        </script>
      </html>
    `)
  })

  app.get('/aut-commands', async (req, res) => {
    const script = (await fs.readFileAsync(path.join(__dirname, '..', 'fixtures', 'aut-commands.js'))).toString()

    res.send(`
      <html>
        <body>
          <input type="file" />
          <script>${script}</script>
        </body>
      </html>
    `)
  })

  app.use(express.static(path.join(__dirname, '..')))

  app.use(require('errorhandler')())

  return app
}

httpPorts.forEach((port) => {
  const app = createApp(port)
  const server = http.Server(app)

  return server.listen(app.get('port'), () => {
    // eslint-disable-next-line no-console
    return console.log('Express server listening on port', app.get('port'))
  })
})

// Have two HTTPS ports in order to test same-site cookie behavior in `cookie_behavior.cy.ts`
// Cookies can be same site if the port is different, and we need a way to test this E2E
// style to make sure we implement cookie handling correctly
httpsPorts.forEach((port) => {
  const httpsApp = createApp(port)
  const httpsServer = httpsProxy.httpsServer(httpsApp)

  return httpsServer.listen(port, () => {
    // eslint-disable-next-line no-console
    return console.log('Express server listening on port', port, '(HTTPS)')
  })
})
