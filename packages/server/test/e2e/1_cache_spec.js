const fs = require('fs')
const path = require('path')
const Fixtures = require('../support/helpers/fixtures')
const e2e = require('../support/helpers/e2e').default

const replacerRe = /(<h1>)\w+(<\/h1>)/

const e2ePath = Fixtures.projectPath('e2e')

let requestsForCache = 0

const onServer = function (app) {
  app.post('/write/:text', (req, res) => {
    const file = path.join(e2ePath, 'index.html')

    return fs.readFile(file, 'utf8', (err, str) => {
      // replace the word between <h1>...</h1>
      str = str.replace(replacerRe, `$1${req.params.text}$2`)

      return fs.writeFile(file, str, (err) => {
        return res.sendStatus(200)
      })
    })
  })

  return app.get('/cached', (req, res) => {
    requestsForCache += 1

    return res
    .set('cache-control', 'public, max-age=3600')
    .send('this response will be disk cached')
  })
}

describe('e2e cache', () => {
  e2e.setup({
    servers: {
      port: 1515,
      onServer,
      static: {
        // force caching to happen
        maxAge: 3600000,
      },
    },
  })

  it('passes', function () {
    return e2e.exec(this, {
      spec: 'cache_spec.coffee',
      snapshot: true,
    })
  })

  it('clears cache when browser is spawned', function () {
    return e2e.exec(this, {
      spec: 'cache_clearing_spec.coffee',
    })
    .then(() => {
      // only 1 request should have gone out
      expect(requestsForCache).to.eq(1)

      return e2e.exec(this, {
        spec: 'cache_clearing_spec.coffee',
      })
      .then(() => {
        // and after the cache is cleaned before
        // opening the browser, it'll make a new request
        expect(requestsForCache).to.eq(2)
      })
    })
  })
})
