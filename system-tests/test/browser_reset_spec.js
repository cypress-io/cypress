const express = require('express')
const Fixtures = require('../lib/fixtures')
const systemTests = require('../lib/system-tests').default

const e2ePath = Fixtures.projectPath('e2e')

let requestsForCache = 0
let requestsForServiceWorkerCache = 0

const onServer = function (app) {
  requestsForCache = 0
  requestsForServiceWorkerCache = 0

  app.use(express.static(e2ePath, {
    // force caching to happen
    maxAge: 3600000,
  }))

  app.get('/cached', (req, res) => {
    requestsForCache += 1

    return res
    .set('cache-control', 'public, max-age=3600')
    .send('this response will be disk cached')
  })

  app.get('/cached-sw', (req, res) => {
    requestsForServiceWorkerCache += 1

    return res
    .send('this response will be disk cached by service worker')
  })
}

describe('e2e browser reset', () => {
  systemTests.setup({
    servers: {
      port: 1515,
      onServer,
    },
  })

  systemTests.it('executes two specs with a cached call', {
    project: 'e2e',
    spec: 'browser_reset_first_spec.cy.js,browser_reset_second_spec.cy.js',
    onRun: async (exec, browser) => {
      await exec()
      // Ensure that the cache was not used for either response
      expect(requestsForCache).to.eq(2)
      if (browser.family === 'chromium') {
        expect(requestsForServiceWorkerCache).to.eq(2)
      }
    },
  })
})
