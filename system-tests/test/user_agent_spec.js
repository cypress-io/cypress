const systemTests = require('../lib/system-tests').default

const onServer = function (app) {
  app.get('/agent', (req, res) => {
    const agent = req.headers['user-agent']

    return res.send(`<html><span id='agent'>${agent}</span></html>`)
  })

  return app.put('/agent', (req, res) => {
    return res.json({
      userAgent: req.headers['user-agent'],
    })
  })
}

describe('e2e user agent', () => {
  systemTests.setup({
    servers: {
      port: 4545,
      onServer,
    },
    settings: {
      userAgent: 'foo bar baz agent',
      e2e: {
        baseUrl: 'http://localhost:4545',
      },
    },
  })

  systemTests.it('passes', {
    browser: '!webkit', // TODO(webkit): fix+unskip
    spec: 'user_agent.cy.js',
    snapshot: true,
  })
})
