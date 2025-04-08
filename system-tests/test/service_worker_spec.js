const express = require('express')
const Fixtures = require('../lib/fixtures')
const systemTests = require('../lib/system-tests').default

const e2ePath = Fixtures.projectPath('e2e')

let requestsForServiceWorkerCache = 0

const onServer = function (app) {
  app.use(express.static(e2ePath, {
    // force caching to happen
    maxAge: 3600000,
  }))

  app.get('/service-worker-assets/scope/cached-service-worker', (req, res) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
    })

    // redirect to cached-sw-redirect on a cross origin server
    return res.redirect('https://localhost:1516/cached-sw-redirect')
  })

  app.get('/cached-sw-redirect', (req, res) => {
    requestsForServiceWorkerCache += 1
    res.set({
      'Access-Control-Allow-Origin': '*',
    })

    return res.send('this response will be used by service worker')
  })
}

describe('e2e service worker', () => {
  systemTests.setup({
    servers: [{
      https: true,
      port: 1515,
      onServer,
    }, {
      https: true,
      port: 1516,
      onServer,
    }],
  })

  systemTests.it('executes one spec with a cached call', {
    project: 'e2e',
    spec: 'service_worker.cy.js',
    onRun: async (exec, browser) => {
      await exec()
      // Ensure that we only called this once even though we loaded the
      // service worker twice
      expect(requestsForServiceWorkerCache).to.eq(1)
    },
  })
})
