const bodyParser = require('body-parser')
const systemTests = require('../lib/system-tests').default

const onServer = function (app) {
  app.use(bodyParser.json())

  app.get('/', (req, res) => {
    return res.send('<html>hi there</html>')
  })

  app.post('/login', (req, res) => {
    return res.json({
      body: req.body,
      headers: req.headers,
    })
  })

  app.post('/html', (req, res) => {
    return res.json({ content: '<html>content</html>' })
  })

  app.get('/json', (req, res) => {
    res.setHeader('Set-Cookie', 'foo=bar')

    return res.json({ content: 'json' })
  })
}

describe('e2e xhr', () => {
  systemTests.setup({
    servers: {
      port: 1919,
      onServer,
    },
    settings: {
      hosts: {
        '*.foobar.com': '127.0.0.1',
      },
      e2e: {},
    },
  })

  systemTests.it('passes in global mode', {
    browser: '!webkit', // TODO(webkit): fix+unskip
    spec: 'xhr.cy.js',
    snapshot: true,
  })

  systemTests.it('passes through CLI', {
    browser: '!webkit', // TODO(webkit): fix+unskip
    spec: 'xhr.cy.js',
    snapshot: true,
    useCli: true,
  })
})
