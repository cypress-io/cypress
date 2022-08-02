const express = require('express')
const fs = require('fs')
const path = require('path')
const Fixtures = require('../lib/fixtures')
const systemTests = require('../lib/system-tests').default

const replacerRe = /(<h1>)\w+(<\/h1>)/

const e2ePath = Fixtures.projectPath('e2e')

let requestsForCache = 0

const onServer = function (app) {
  app.use(express.static(e2ePath, {
    // force caching to happen
    maxAge: 3600000,
  }))

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

  app.get('/cached', (req, res) => {
    requestsForCache += 1

    return res
    .set('cache-control', 'public, max-age=3600')
    .send('this response will be disk cached')
  })
}

describe('e2e cache', () => {
  systemTests.setup({
    servers: {
      port: 1515,
      onServer,
    },
  })

  it('passes', function () {
    return systemTests.exec(this, {
      spec: 'cache.cy.js',
      snapshot: true,
    })
  })

  it('clears cache when browser is spawned', function () {
    return systemTests.exec(this, {
      spec: 'cache_clearing.cy.js',
    })
    .then(() => {
      // only 1 request should have gone out
      expect(requestsForCache).to.eq(1)

      return systemTests.exec(this, {
        spec: 'cache_clearing.cy.js',
      })
      .then(() => {
        // and after the cache is cleaned before
        // opening the browser, it'll make a new request
        expect(requestsForCache).to.eq(2)
      })
    })
  })
})
