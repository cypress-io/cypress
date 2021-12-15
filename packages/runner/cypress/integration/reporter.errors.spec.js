import { verify, verifyInternalFailure } from '../support/verify-failures'

describe('errors ui', () => {
  describe('assertion failures', () => {
    const file = 'assertions_spec.js'

    verify.it('with expect().<foo>', {
      file,
      column: 25,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('with assert()', {
      file,
      column: '(5|12)', // (chrome|firefox)
      message: `should be true`,
    })

    verify.it('with assert.<foo>()', {
      file,
      column: 12,
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('exception failures', () => {
    const file = 'exceptions_spec.js'

    verify.it('in spec file', {
      file,
      column: 10,
      message: 'bar is not a function',
    })

    verify.it('in file outside project', {
      file,
      message: 'An outside error',
      regex: /todos\/throws\-error\.js:5:9/,
      codeFrameText: `thrownewError('An outside error')`,
      verifyOpenInIde: false,
    })
  })

  describe('hooks', { viewportHeight: 900 }, () => {
    const file = 'hooks_spec.js'

    // https://github.com/cypress-io/cypress/issues/8214
    // https://github.com/cypress-io/cypress/issues/8288
    // https://github.com/cypress-io/cypress/issues/8350
    verify.it('errors when a hook is nested in another hook', {
      file,
      column: '(7|18)', // (chrome|firefox)
      codeFrameText: 'beforeEach(()=>',
      message: `Cypress detected you registered a(n) beforeEach hook while a test was running`,
    })
  })

  describe('commands', () => {
    const file = 'commands_spec.js'

    verify.it('failure', {
      file,
      column: 8,
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
    })

    verify.it('chained failure', {
      file,
      column: 20,
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('cy.then', () => {
    const file = 'then_spec.js'

    verify.it('assertion failure', {
      file,
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('exception', {
      file,
      column: 12,
      message: 'bar is not a function',
    })

    verify.it('command failure', {
      file,
      column: 10,
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('cy.should', () => {
    const file = 'should_spec.js'

    verify.it('callback assertion failure', {
      file,
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('callback exception', {
      file,
      column: 12,
      message: 'bar is not a function',
    })

    verify.it('standard assertion failure', {
      file,
      column: 6,
      message: 'Timed out retrying after 0ms: expected {} to have property \'foo\'',
    })

    verify.it('after multiple', {
      file,
      column: 6,
      message: 'Timed out retrying after 0ms: expected \'foo\' to equal \'bar\'',
    })

    verify.it('after multiple callbacks exception', {
      file,
      column: 12,
      codeFrameText: '({}).bar()',
      message: 'bar is not a function',
    })

    verify.it('after multiple callbacks assertion failure', {
      file,
      column: 27,
      codeFrameText: '.should(()=>',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('after callback success assertion failure', {
      file,
      column: 6,
      codeFrameText: '.should(\'have.property',
      message: `expected {} to have property 'foo'`,
    })

    verify.it('command failure after success', {
      file,
      column: 8,
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('cy.each', () => {
    const file = 'each_spec.js'

    verify.it('assertion failure', {
      file,
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('exception', {
      file,
      column: 12,
      message: 'bar is not a function',
    })

    verify.it('command failure', {
      file,
      column: 10,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('cy.spread', () => {
    const file = 'spread_spec.js'

    verify.it('assertion failure', {
      file,
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('exception', {
      file,
      column: 12,
      message: 'bar is not a function',
    })

    verify.it('command failure', {
      file,
      column: 10,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('cy.within', () => {
    const file = 'within_spec.js'

    verify.it('assertion failure', {
      file,
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('exception', {
      file,
      column: 12,
      message: 'bar is not a function',
    })

    verify.it('command failure', {
      file,
      column: 10,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('cy.wrap', () => {
    const file = 'wrap_spec.js'

    verify.it('assertion failure', {
      file,
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('exception', {
      file,
      column: 12,
      message: 'bar is not a function',
    })

    verify.it('command failure', {
      file,
      column: 10,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('cy.visit', () => {
    const file = 'visit_spec.js'

    verify.it('onBeforeLoad assertion failure', {
      file,
      column: 29,
      codeFrameText: 'onBeforeLoad',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('onBeforeLoad exception', {
      file,
      column: 14,
      codeFrameText: 'onBeforeLoad',
      message: 'bar is not a function',
    })

    verify.it('onLoad assertion failure', {
      file,
      column: 29,
      codeFrameText: 'onLoad',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('onLoad exception', {
      file,
      column: 14,
      codeFrameText: 'onLoad',
      message: 'bar is not a function',
    })
  })

  describe('cy.intercept', () => {
    const file = 'intercept_spec.ts'

    verify.it('assertion failure in req callback', {
      file,
      column: 22,
      message: [
        `expected 'a' to equal 'b'`,
      ],
      notInMessage: [
        'The following error originated from your spec code',
      ],
    })

    verify.it('assertion failure in res callback', {
      file,
      column: 24,
      codeFrameText: '.reply(()=>{',
      message: [
        `expected 'b' to equal 'c'`,
      ],
      notInMessage: [
        'The following error originated from your spec code',
      ],
    })

    verify.it('fails when erroneous response is received while awaiting response', {
      file,
      column: 6,
      // this fails the active test because it's an asynchronous
      // response failure from the network
      codeFrameText: '.wait(1000)',
      message: [
        'A callback was provided to intercept the upstream response, but a network error occurred while making the request',
      ],
      notInMessage: [
        'The following error originated from your spec code',
      ],
    })
  })

  describe('cy.route', () => {
    const file = 'route_spec.js'

    verify.it('callback assertion failure', {
      file,
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('callback exception', {
      file,
      column: 12,
      message: 'bar is not a function',
    })

    verify.it('command failure', {
      file,
      column: 10,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })

    verify.it('onAbort assertion failure', {
      file,
      column: 29,
      codeFrameText: 'onAbort',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('onAbort exception', {
      file,
      column: 14,
      codeFrameText: 'onAbort',
      message: 'bar is not a function',
    })

    verify.it('onRequest assertion failure', {
      file,
      column: 29,
      codeFrameText: 'onRequest',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('onRequest exception', {
      file,
      column: 14,
      codeFrameText: 'onRequest',
      message: 'bar is not a function',
    })

    verify.it('onResponse assertion failure', {
      file,
      column: 29,
      codeFrameText: 'onResponse',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('onResponse exception', {
      file,
      column: 14,
      codeFrameText: 'onResponse',
      message: 'bar is not a function',
    })
  })

  describe('cy.server', () => {
    const file = 'server_spec.js'

    verify.it('onAbort assertion failure', {
      file,
      column: 29,
      codeFrameText: 'onAbort',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('onAbort exception', {
      file,
      column: 14,
      codeFrameText: 'onAbort',
      message: 'bar is not a function',
    })

    verify.it('onRequest assertion failure', {
      file,
      column: 29,
      codeFrameText: 'onRequest',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('onRequest exception', {
      file,
      column: 14,
      codeFrameText: 'onRequest',
      message: 'bar is not a function',
    })

    verify.it('onResponse assertion failure', {
      file,
      column: 29,
      codeFrameText: 'onResponse',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('onResponse exception', {
      file,
      column: 14,
      codeFrameText: 'onResponse',
      message: 'bar is not a function',
    })
  })

  describe('cy.readFile', () => {
    const file = 'readfile_spec.js'

    verify.it('existence failure', {
      onBeforeRun ({ win }) {
        win.runnerWs.emit.withArgs('backend:request', 'read:file')
        .yields({ error: { code: 'ENOENT' } })
      },
      file,
      column: 8,
      message: 'failed because the file does not exist',
    })
  })

  describe('validation errors', () => {
    const file = 'validation_spec.js'

    verify.it('from cypress', {
      file,
      column: 8,
      message: 'can only accept a string preset or',
      stack: ['throwErrBadArgs', 'From Your Spec Code:'],
    })

    verify.it('from chai expect', {
      file,
      column: '(5|12)', // (chrome|firefox)
      message: 'Invalid Chai property: nope',
      stack: ['proxyGetter', 'From Your Spec Code:'],
    })

    verify.it('from chai assert', {
      file,
      column: 12,
      message: 'object tested must be an array',
    })
  })

  describe('event handlers', () => {
    const file = 'events_spec.js'

    verify.it('event assertion failure', {
      file,
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('event exception', {
      file,
      column: 12,
      message: 'bar is not a function',
    })

    verify.it('fail handler assertion failure', {
      file,
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('fail handler exception', {
      file,
      column: 12,
      message: 'bar is not a function',
    })
  })

  describe('uncaught errors', () => {
    const file = 'uncaught_spec.js'

    verify.it('sync app visit exception', {
      file,
      uncaught: true,
      command: 'visit',
      visitUrl: 'http://localhost:3500/fixtures/errors.html?error-on-visit',
      originalMessage: 'visit error',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
      regex: /localhost\:\d+\/fixtures\/errors.html\?error-on-visit:\d+:\d+/,
      hasCodeFrame: false,
      verifyOpenInIde: false,
    })

    verify.it('sync app navigates to visit exception', {
      file,
      uncaught: true,
      visitUrl: 'http://localhost:3500/fixtures/errors.html',
      originalMessage: 'visit error',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
      regex: /localhost\:\d+\/fixtures\/errors.html\?error-on-visit:\d+:\d+/,
      hasCodeFrame: false,
      verifyOpenInIde: false,
    })

    verify.it('sync app exception', {
      file,
      uncaught: true,
      command: 'click',
      visitUrl: 'http://localhost:3500/fixtures/errors.html',
      originalMessage: 'sync error',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
      regex: /localhost\:\d+\/fixtures\/errors.html:\d+:\d+/,
      hasCodeFrame: false,
      verifyOpenInIde: false,
    })

    verify.it('async app exception', {
      file,
      uncaught: true,
      visitUrl: 'http://localhost:3500/fixtures/errors.html',
      originalMessage: 'async error',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
      regex: /localhost\:\d+\/fixtures\/errors.html:\d+:\d+/,
      hasCodeFrame: false,
      verifyOpenInIde: false,
    })

    verify.it('app unhandled rejection', {
      file,
      uncaught: true,
      visitUrl: 'http://localhost:3500/fixtures/errors.html',
      originalMessage: 'promise rejection',
      message: [
        'The following error originated from your application code',
        'It was caused by an unhandled promise rejection',
      ],
      regex: /localhost\:\d+\/fixtures\/errors.html:\d+:\d+/,
      hasCodeFrame: false,
      verifyOpenInIde: false,
    })

    verify.it('async spec exception', {
      file,
      uncaught: true,
      column: 12,
      originalMessage: 'bar is not a function',
      message: [
        'The following error originated from your test code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify.it('async spec exception with done', {
      file,
      uncaught: true,
      column: 12,
      originalMessage: 'bar is not a function',
      message: [
        'The following error originated from your test code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify.it('spec unhandled rejection', {
      file,
      uncaught: true,
      column: 20,
      originalMessage: 'Unhandled promise rejection from the spec',
      message: [
        'The following error originated from your test code',
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify.it('spec unhandled rejection with done', {
      file,
      uncaught: true,
      column: 20,
      originalMessage: 'Unhandled promise rejection from the spec',
      message: [
        'The following error originated from your test code',
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify.it('spec Bluebird unhandled rejection', {
      file,
      uncaught: true,
      column: 21,
      originalMessage: 'Unhandled promise rejection from the spec',
      message: [
        'The following error originated from your test code',
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify.it('spec Bluebird unhandled rejection with done', {
      file,
      uncaught: true,
      column: 21,
      originalMessage: 'Unhandled promise rejection from the spec',
      message: [
        'The following error originated from your test code',
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify.it('exception inside uncaught:exception', {
      file,
      uncaught: true,
      uncaughtMessage: 'sync error',
      visitUrl: 'http://localhost:3500/fixtures/errors.html',
      column: 12,
      originalMessage: 'bar is not a function',
      message: [
        'The following error originated from your test code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
    })

    // NOTE: the following 2 test don't have uncaught: true because we don't
    // display command logs if there are only events and not true commands
    // and uncaught: true causes the verification to look for the error
    // event command log
    verify.it('spec exception outside test', {
      file: 'uncaught_outside_test_spec.js',
      column: 7,
      message: [
        'The following error originated from your test code',
        'error from outside test',
        'Cypress could not associate this error to any specific test',
      ],
      codeFrameText: `thrownewError('error from outside test')`,
    })

    verify.it('spec exception outside test with only suite', {
      file: 'uncaught_outside_test_only_suite_spec.js',
      column: 7,
      message: [
        'error from outside test with only suite',
        'The following error originated from your test code',
        'Cypress could not associate this error to any specific test',
      ],
      codeFrameText: `thrownewError('error from outside test with only suite')`,
    })
  })

  describe('custom commands', () => {
    const file = 'custom_commands_spec.js'

    verify.it('assertion failure', {
      file,
      column: 23,
      message: `expected 'actual' to equal 'expected'`,
      codeFrameText: `add('failAssertion'`,
    })

    verify.it('exception', {
      file,
      column: 8,
      message: 'bar is not a function',
      codeFrameText: `add('failException'`,
    })

    verify.it('command failure', {
      file,
      column: 6,
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
      codeFrameText: `add('failCommand'`,
    })
  })

  describe('typescript', () => {
    const file = 'typescript_spec.ts'

    verify.it('assertion failure', {
      file,
      column: 25,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify.it('exception', {
      file,
      column: 10,
      message: 'bar is not a function',
    })

    verify.it('command failure', {
      file,
      column: 8,
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('docs url', () => {
    after(() => {
      window.top.__cySkipValidateConfig = false
    })

    const file = 'docs_url_spec.js'
    const docsUrl = 'https://on.cypress.io/viewport'

    window.top.__cySkipValidateConfig = true
    verify.it('displays as button in interactive mode', { retries: 1 }, {
      file,
      verifyFn () {
        cy
        .get('.runnable-err-message')
        .should('not.contain', docsUrl)
        .contains('Learn more')
        .should('have.attr', 'href', docsUrl)
      },
    })

    verify.it('is text in error message in run mode', {
      file,
      verifyFn () {
        cy
        .get('.runnable-err-message')
        .should('contain', docsUrl)
        .contains('Learn more')
        .should('not.exist')
      },
    })
  })

  // cases where there is a bug in Cypress and we should show cypress internals
  // instead of the invocation stack. we test this by monkey-patching internal
  // methods to make them throw an error
  describe('unexpected errors', () => {
    const file = 'unexpected_spec.js'

    // FIXME: the eval doesn't seem to take effect and overwrite the method
    // so it ends up not failing properly
    verify.it.skip('Cypress method error', {
      file,
      verifyFn: verifyInternalFailure,
      method: 'Cypress.LocalStorage._isSpecialKeyword',
    })

    verify.it('internal cy error', {
      file,
      verifyFn: verifyInternalFailure,
      method: 'cy.expect',
    })
  })
})
