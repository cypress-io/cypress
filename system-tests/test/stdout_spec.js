const systemTests = require('../lib/system-tests').default

describe('e2e stdout', () => {
  systemTests.setup({
    servers: [{
      port: 1777,
      https: true,
      onServer: (app) => {
        app.get('/', (req, res) => {
          res.set('content-type', 'text/html').end('it worked')
        })
      },
    }],
    settings: {
      hosts: {
        'www.google.com': '127.0.0.1',
        'www.apple.com': '127.0.0.1',
        '*.cypress.io': '127.0.0.1',
      },
      e2e: {},
    },
  })

  it('displays errors from failures', function () {
    return systemTests.exec(this, {
      port: 2020,
      snapshot: true,
      spec: 'stdout_failing.cy.js',
      expectedExitCode: 3,
      onStdout: (stdout) => {
        // assert stack trace line numbers/columns mirror source map
        expect(stdout).to.include('Context.eval (webpack://e2e/./cypress/e2e/stdout_failing.cy.js:7:12)')
        expect(stdout).to.include('Context.eval (webpack://e2e/./cypress/e2e/stdout_failing.cy.js:15:9)')
        expect(stdout).to.include('Context.eval (webpack://e2e/./cypress/e2e/stdout_failing.cy.js:27:9)')
      },
    })
  })

  it('displays errors from exiting early due to bundle errors', function () {
    return systemTests.exec(this, {
      spec: 'stdout_exit_early_failing.cy.js',
      snapshot: true,
      expectedExitCode: 1,
      onStdout: systemTests.normalizeWebpackErrors,
    })
  })

  it('does not duplicate suites or tests between visits', function () {
    return systemTests.exec(this, {
      spec: 'stdout_passing.cy.js',
      timeout: 120000,
      snapshot: true,
    })
  })

  it('respects quiet mode', function () {
    return systemTests.exec(this, {
      spec: 'stdout_passing.cy.js',
      timeout: 120000,
      snapshot: true,
      quiet: true,
    })
  })

  it('displays fullname of nested specfile', function () {
    return systemTests.exec(this, {
      port: 2020,
      snapshot: true,
      spec: 'nested-1/nested-2/nested-3/**/*',
    })
  })

  systemTests.it('displays assertion errors', {
    spec: 'stdout_assertion_errors.cy.js',
    snapshot: true,
    expectedExitCode: 4,
  })
})
