const helpers = require('../support/helpers')

const { verify } = helpers.createCypress({
  config: { isTextTerminal: true, retries: 0 },
  visitUrl: 'http://localhost:3500/fixtures/isolated-runner-inner.html',
})

const verifyInternalFailure = (props) => {
  const { method } = props

  cy.get('.runnable-err-message')
  .should('include.text', `thrown in ${method.replace(/\./g, '-')}`)

  cy.get('.runnable-err-stack-expander > .collapsible-header').click()

  cy.get('.runnable-err-stack-trace')
  .should('include.text', method)

  cy.get('.test-err-code-frame')
  .should('not.exist')
}

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
      column: '(5|12)',
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

  describe('commands', () => {
    const file = 'commands_spec.js'

    verify.it('failure', {
      file,
      column: 8,
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })

    verify.it('chained failure', {
      file,
      column: 20,
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
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
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
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
      message: 'Timed out retrying: expected {} to have property \'foo\'',
    })

    verify.it('after multiple', {
      file,
      column: 6,
      message: 'Timed out retrying: expected \'foo\' to equal \'bar\'',
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
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
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

    // FIXME: in isolated runner, the error ends up uncaught for
    // some reason, which throws off the test
    verify.it.skip('onResponse assertion failure', {
      file,
      column: 29,
      codeFrameText: 'onResponse',
      message: `expected 'actual' to equal 'expected'`,
    })

    // FIXME: in isolated runner, the error ends up uncaught for
    // some reason, which throws off the test
    verify.it.skip('onResponse exception', {
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

    // FIXME: in isolated runner, the error ends up uncaught for
    // some reason, which throws off the test
    verify.it.skip('onResponse assertion failure', {
      file,
      column: 29,
      codeFrameText: 'onResponse',
      message: `expected 'actual' to equal 'expected'`,
    })

    // FIXME: in isolated runner, the error ends up uncaught for
    // some reason, which throws off the test
    verify.it.skip('onResponse exception', {
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
      column: '(5|12)', // different between chrome & firefox
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

    verify.it('sync app exception', {
      file,
      message: [
        'The following error originated from your application code',
        'syncReference is not defined',
      ],
      regex: /localhost\:\d+\/fixtures\/isolated-runner-inner.html:\d+:\d+/,
      hasCodeFrame: false,
      verifyOpenInIde: false,
    })

    // FIXME: does not get caught and wrapped like it does in real cypress
    verify.it.skip('async app exception', {
      file,
      message: [
        'The following error originated from your application code',
        'asyncReference is not defined',
      ],
      regex: /localhost\:\d+\/fixtures\/isolated-runner-inner.html:\d+:\d+/,
      hasCodeFrame: false,
      verifyOpenInIde: false,
    })

    verify.it('async exception', {
      file,
      column: 12,
      message: [
        'bar is not a function',
        'The following error originated from your test code',
      ],
    })

    verify.it('async exception with done', {
      file,
      column: 12,
      message: [
        'bar is not a function',
        'The following error originated from your test code',
      ],
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
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
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
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('docs url', () => {
    const file = 'docs_url_spec.js'
    const docsUrl = 'https://on.cypress.io/viewport'

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
  // instead of the invocation stack. we do this by monkey-patching internal
  // methods to make them throw an error
  describe('unexpected errors', () => {
    const file = 'unexpected_spec.js'

    verify.it('Cypress method error', {
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
