const express = require('express')
const Fixtures = require('../lib/fixtures')
const systemTests = require('../lib/system-tests').default

const e2ePath = Fixtures.projectPath('e2e')

let requestsForWebWorker = 0

const onServer = function (app) {
  app.use(express.static(e2ePath, {
    // force caching to happen
    maxAge: 3600000,
  }))

  app.get('/ww.js', (req, res) => {
    requestsForWebWorker += 1

    res.set('Content-Type', 'application/javascript')
    res.set('Mime-Type', 'application/javascript')

    return res.send('const x = 1')
  })
}

describe('e2e web worker', () => {
  systemTests.setup({
    servers: [{
      https: true,
      port: 1515,
      onServer,
    }],
  })

  systemTests.it('executes one spec with a cached call', {
    project: 'e2e',
    spec: 'web_worker.cy.js',
    onRun: async (exec, browser) => {
      await exec()
      expect(requestsForWebWorker).to.eq(2)
    },
  })
})
