const bodyParser = require('body-parser')
const e2e = require('../support/helpers/e2e').default

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
  e2e.setup({
    servers: {
      port: 1919,
      onServer,
    },
  })

  e2e.it('passes in global mode', {
    spec: 'xhr_spec.coffee',
    snapshot: true,
  })

  e2e.it('passes through CLI', {
    spec: 'xhr_spec.coffee',
    snapshot: true,
    useCli: true,
  })
})
