const express = require('express')
const Fixtures = require('../lib/fixtures')
const systemTests = require('../lib/system-tests').default

const e2ePath = Fixtures.projectPath('e2e')

const onServer = function (app) {
  app.use(express.static(e2ePath, {
    // force caching to happen
    maxAge: 3600000,
  }))
}

describe('e2e other target', () => {
  systemTests.setup({
    servers: [{
      port: 1515,
      onServer,
    }, {
      https: true,
      port: 1516,
      onServer,
    }],
  })

  systemTests.it.only(`executes a page with a target type of 'other'`, {
    project: 'e2e',
    spec: 'other_target.cy.js',
    headed: true,
    noExit: true,
  })
})
