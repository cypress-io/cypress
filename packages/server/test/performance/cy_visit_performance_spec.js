const systemTests = require('@tooling/system-tests/lib/system-tests').default

// https://github.com/cypress-io/cypress/issues/4313
context('cy.visit performance tests', function () {
  this.retries(3)

  systemTests.setup({
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
  })

  const onStdout = (stdout) => {
    return stdout.replace(/^\d+%\s+of visits to [^\s]+ finished in less than.*$/gm, 'histogram line')
  }

  systemTests.it('passes', {
    browser: '!webkit', // TODO(webkit): does this really need to run in all browsers? currently it's broken in webkit because we are missing deps
    configFile: 'cypress-performance.config.js',
    onStdout,
    spec: 'fast_visit.cy.js',
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
