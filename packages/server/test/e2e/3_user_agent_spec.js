const e2e = require('../support/helpers/e2e').default

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
  e2e.setup({
    servers: {
      port: 4545,
      onServer,
    },
    settings: {
      userAgent: 'foo bar baz agent',
      baseUrl: 'http://localhost:4545',
    },
  })

  e2e.it('passes', {
    spec: 'user_agent_spec.coffee',
    snapshot: true,
  })
})
