const express = require('express')
const Fixtures = require('../lib/fixtures')
const systemTests = require('../lib/system-tests').default

const e2ePath = Fixtures.projectPath('e2e')

let requestsForServiceWorkerCache = 0

const onServer = function (app) {
  requestsForServiceWorkerCache = 0

  app.use(express.static(e2ePath, {
    // force caching to happen
    maxAge: 3600000,
  }))

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

  systemTests.it('executes one spec with a cached call', {
    project: 'e2e',
    browser: 'chrome',
    spec: 'service_worker.cy.js',
    onRun: async (exec, browser) => {
      await exec()
      expect(requestsForServiceWorkerCache).to.eq(1)
    },
  })
})
