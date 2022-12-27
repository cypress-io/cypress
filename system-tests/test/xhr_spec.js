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

  return app.post('/html', (req, res) => {
    return res.json({ content: '<html>content</html>' })
  })
}

describe('e2e xhr', () => {
  systemTests.setup({
    servers: {
      port: 1919,
      onServer,
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
