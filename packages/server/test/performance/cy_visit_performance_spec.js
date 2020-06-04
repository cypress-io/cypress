const e2e = require('../support/helpers/e2e').default

// https://github.com/cypress-io/cypress/issues/4313
context('cy.visit performance tests', function () {
  this.retries(3)

  e2e.setup({
    servers: {
      port: 3434,
      onServer (app) {
        app.get('/keepalive', function (req, res) {
          res.type('html').send('hi')
        })

        app.get('/close', function (req, res) {
          res.set('connection', 'close').type('html').send('hi')
        })
      },
    },
    settings: {
      baseUrl: 'http://localhost:3434',
      video: false,
    },
  })

  const onStdout = (stdout) => {
    return stdout.replace(/^\d+%\s+of visits to [^\s]+ finished in less than.*$/gm, 'histogram line')
  }

  e2e.it('passes', {
    onStdout,
    spec: 'fast_visit_spec.coffee',
    snapshot: true,
    onRun (exec, browser, ctx) {
      return exec({
        config: {
          video: false,
          env: {
            currentRetry: ctx.test._currentRetry,
          },
        },
      })
    },
  })
})
