import { createVerify, verifyInternalFailure } from './support/verify-failures'

const loadSpec = ({
  fileName,
  onLoadStatsMessage,
  hasPreferredIde = false,
}) => {
  cy.withCtx((ctx, options) => {
    if (options.hasPreferredIde) {
      // set preferred editor to bypass IDE selection dialog
      ctx.coreData.localSettings.availableEditors = [
        ...ctx.coreData.localSettings.availableEditors,
        {
          id: 'test-editor',
          binary: '/usr/bin/test-editor',
          name: 'Test editor',
        },
      ]

      ctx.coreData.localSettings.preferences.preferredEditorBinary = 'test-editor'
    }

    ctx.coreData.localSettings.preferences.isSpecsListOpen = false
  }, { hasPreferredIde })

  cy.startAppServer()
  cy.visitApp()

  // directly visiting the spec will sometimes hang, going through
  // specs page first to mitigate
  cy.contains('[data-cy=spec-item]', fileName).click()

  cy.location().should((location) => {
    expect(location.hash).to.contain(fileName)
  })

  // Wait for specs to complete
  cy.findByLabelText('Stats', { timeout: 30000 })
  .get('.failed', { timeout: 10000 }).should('have.text', onLoadStatsMessage)

  return createVerify({ fileName, hasPreferredIde })
}

describe('errors ui', {
  viewportHeight: 768,
  viewportWidth: 1024,
  numTestsKeptInMemory: 1,
}, () => {
  beforeEach(() => {
    cy.scaffoldProject('runner-e2e-specs')
    cy.openProject('runner-e2e-specs')
  })

  it('assertion failures', () => {
    const verify = loadSpec({
      fileName: 'assertions.cy.js',
      hasPreferredIde: true,
      onLoadStatsMessage: 'Failed:3',
    })

    verify('with expect().<foo>', {
      column: 25,
      message: `expected 'actual' to equal 'expected'`,
      verifyOpenInIde: true,
    })

    verify('with assert()', {
      column: '(5|12)', // (chrome|firefox)
      message: `should be true`,
      verifyOpenInIde: true,
    })

    verify('with assert.<foo>()', {
      column: 12,
      message: `expected 'actual' to equal 'expected'`,
      verifyOpenInIde: true,
    })
  })

  it('assertion failures - no preferred IDE', () => {
    const verify = loadSpec({
      fileName: 'assertions.cy.js',
      onLoadStatsMessage: 'Failed:3',
    })

    verify('with expect().<foo>', {
      file: 'assertions.cy.js',
      hasPreferredIde: false,
      column: 25,
      message: `expected 'actual' to equal 'expected'`,
      codeFrameText: 'with expect().<foo>',
      verifyOpenInIde: true,
    })
  })

  it('exception failures', () => {
    const verify = loadSpec({
      fileName: 'exceptions.cy.js',
      onLoadStatsMessage: 'Failed:2',
    })

    verify('in spec file', {
      column: 10,
      message: 'bar is not a function',
    })

    verify('in file outside project', {
      message: 'An outside error',
      regex: /\/throws\-error\.js:5:9/,
      codeFrameText: `thrownewError('An outside error')`,
    })
  })

  it('hooks', { viewportHeight: 900 }, () => {
    const verify = loadSpec({
      fileName: 'hooks.cy.js',
      onLoadStatsMessage: 'Failed:1',
    })

    // https://github.com/cypress-io/cypress/issues/8214
    // https://github.com/cypress-io/cypress/issues/8288
    // https://github.com/cypress-io/cypress/issues/8350
    verify('test', {
      column: '(7|18)', // (chrome|firefox)
      codeFrameText: 'beforeEach(()=>',
      message: `Cypress detected you registered a(n) beforeEach hook while a test was running`,
    })
  })

  it('commands', () => {
    const verify = loadSpec({
      fileName: 'commands.cy.js',
      onLoadStatsMessage: 'Failed:2',
    })

    verify('failure', {
      column: 8,
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
    })

    verify('chained failure', {
      column: 20,
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
    })
  })

  it('cy.then', () => {
    const verify = loadSpec({
      fileName: 'then.cy.js',
      onLoadStatsMessage: 'Failed:3',
    })

    verify('assertion failure', {
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('exception', {
      column: 12,
      message: 'bar is not a function',
    })

    verify('command failure', {
      column: 10,
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
    })
  })

  it('cy.should', () => {
    const verify = loadSpec({
      fileName: 'should.cy.js',
      onLoadStatsMessage: 'Failed:8',
    })

    verify('callback assertion failure', {
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('callback exception', {
      column: 12,
      message: 'bar is not a function',
    })

    verify('standard assertion failure', {
      column: 6,
      message: 'Timed out retrying after 0ms: expected {} to have property \'foo\'',
    })

    verify('after multiple', {
      column: 6,
      message: 'Timed out retrying after 0ms: expected \'foo\' to equal \'bar\'',
    })

    verify('after multiple callbacks exception', {
      column: 12,
      codeFrameText: '({}).bar()',
      message: 'bar is not a function',
    })

    verify('after multiple callbacks assertion failure', {
      column: 27,
      codeFrameText: '.should(()=>',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('after callback success assertion failure', {
      column: 6,
      codeFrameText: '.should(\'have.property',
      message: `expected {} to have property 'foo'`,
    })

    verify('command failure after success', {
      column: 8,
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
    })
  })

  it('cy.each', () => {
    const verify = loadSpec({
      fileName: 'each.cy.js',
      onLoadStatsMessage: 'Failed:3',
    })

    verify('assertion failure', {
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('exception', {
      column: 12,
      message: 'bar is not a function',
    })

    verify('command failure', {
      column: 10,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })

  it('cy.spread', () => {
    const verify = loadSpec({
      fileName: 'spread.cy.js',
      onLoadStatsMessage: 'Failed:3',
    })

    verify('assertion failure', {
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('exception', {
      column: 12,
      message: 'bar is not a function',
    })

    verify('command failure', {
      column: 10,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })

  it('cy.within', () => {
    const verify = loadSpec({
      fileName: 'within.cy.js',
      onLoadStatsMessage: 'Failed:3',
    })

    verify('assertion failure', {
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('exception', {
      column: 12,
      message: 'bar is not a function',
    })

    verify('command failure', {
      column: 10,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })

  it('cy.wrap', () => {
    const verify = loadSpec({
      fileName: 'wrap.cy.js',
      onLoadStatsMessage: 'Failed:3',
    })

    verify('assertion failure', {
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('exception', {
      column: 12,
      message: 'bar is not a function',
    })

    verify('command failure', {
      column: 10,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })

  it('cy.visit', () => {
    const verify = loadSpec({
      fileName: 'visit.cy.js',
      onLoadStatsMessage: 'Failed:3',
    })

    verify('onBeforeLoad assertion failure', {
      column: 29,
      codeFrameText: 'onBeforeLoad',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('onBeforeLoad exception', {
      column: 14,
      codeFrameText: 'onBeforeLoad',
      message: 'bar is not a function',
    })

    verify('onLoad assertion failure', {
      column: 29,
      codeFrameText: 'onLoad',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('onLoad exception', {
      column: 14,
      codeFrameText: 'onLoad',
      message: 'bar is not a function',
    })
  })

  it('cy.intercept', () => {
    const verify = loadSpec({
      fileName: 'intercept.cy.ts',
      onLoadStatsMessage: 'Failed:3',
    })

    verify('assertion failure in request callback', {
      column: 22,
      message: [
        `expected 'a' to equal 'b'`,
      ],
      notInMessage: [
        'The following error originated from your spec code',
      ],
    })

    verify('assertion failure in response callback', {
      column: 24,
      codeFrameText: '.reply(()=>{',
      message: [
        `expected 'b' to equal 'c'`,
      ],
      notInMessage: [
        'The following error originated from your spec code',
      ],
    })

    verify('fails when erroneous response is received while awaiting response', {
      column: 6,
      // TODO: determine why code frame output is different in run/open mode
      // this fails the active test because it's an asynchronous
      // response failure from the network
      // codeFrameText: '.wait(1000)',
      hasCodeFrame: false,
      message: [
        'A callback was provided to intercept the upstream response, but a network error occurred while making the request',
      ],
      notInMessage: [
        'The following error originated from your spec code',
      ],
    })
  })

  it('cy.route', () => {
    const verify = loadSpec({
      fileName: 'route.cy.js',
      onLoadStatsMessage: 'Failed:9',
    })

    verify('callback assertion failure', {
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('callback exception', {
      column: 12,
      message: 'bar is not a function',
    })

    verify('command failure', {
      column: 10,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })

    verify('onAbort assertion failure', {
      column: 29,
      codeFrameText: 'onAbort',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('onAbort exception', {
      column: 14,
      codeFrameText: 'onAbort',
      message: 'bar is not a function',
    })

    verify('onRequest assertion failure', {
      column: 29,
      codeFrameText: 'onRequest',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('onRequest exception', {
      column: 14,
      codeFrameText: 'onRequest',
      message: 'bar is not a function',
    })

    verify('onResponse assertion failure', {
      column: 29,
      codeFrameText: 'onResponse',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('onResponse exception', {
      column: 14,
      codeFrameText: 'onResponse',
      message: 'bar is not a function',
    })
  })

  it('cy.server', () => {
    const verify = loadSpec({
      fileName: 'server.cy.js',
      onLoadStatsMessage: 'Failed:6',
    })

    verify('onAbort assertion failure', {
      column: 29,
      codeFrameText: 'onAbort',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('onAbort exception', {
      column: 14,
      codeFrameText: 'onAbort',
      message: 'bar is not a function',
    })

    verify('onRequest assertion failure', {
      column: 29,
      codeFrameText: 'onRequest',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('onRequest exception', {
      column: 14,
      codeFrameText: 'onRequest',
      message: 'bar is not a function',
    })

    verify('onResponse assertion failure', {
      column: 29,
      codeFrameText: 'onResponse',
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('onResponse exception', {
      column: 14,
      codeFrameText: 'onResponse',
      message: 'bar is not a function',
    })
  })

  it('cy.readFile', () => {
    const verify = loadSpec({
      fileName: 'readfile.cy.js',
      onLoadStatsMessage: 'Failed:1',
    })

    verify('existence failure', {
      column: 8,
      message: 'failed because the file does not exist',
    })
  })

  it('validation errors', () => {
    const verify = loadSpec({
      fileName: 'validation.cy.js',
      onLoadStatsMessage: 'Failed:3',
    })

    verify('from cypress', {
      column: 8,
      message: 'can only accept a string preset or',
      stack: ['throwErrBadArgs', 'From Your Spec Code:'],
    })

    verify('from chai expect', {
      column: '(5|12)', // (chrome|firefox)
      message: 'Invalid Chai property: nope',
      stack: ['proxyGetter', 'From Your Spec Code:'],
    })

    verify('from chai assert', {
      column: 12,
      message: 'object tested must be an array',
    })
  })

  it('event handlers', () => {
    const verify = loadSpec({
      fileName: 'events.cy.js',
      onLoadStatsMessage: 'Failed:4',
    })

    verify('event assertion failure', {
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('event exception', {
      column: 12,
      message: 'bar is not a function',
    })

    verify('fail handler assertion failure', {
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('fail handler exception', {
      column: 12,
      message: 'bar is not a function',
    })
  })

  it('uncaught errors', () => {
    const verify = loadSpec({
      fileName: 'uncaught.cy.js',
      onLoadStatsMessage: 'Failed:11',
    })

    verify('sync app visit exception', {
      uncaught: true,
      command: 'visit',
      originalMessage: 'visit error',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
      regex: /localhost\:\d+\/cypress\/fixtures\/errors.html\?error-on-visit:\d+:\d+/,
      hasCodeFrame: false,
    })

    verify('sync app navigates to visit exception', {
      uncaught: true,
      originalMessage: 'visit error',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
      regex: /localhost\:\d+\/cypress\/fixtures\/errors.html\?error-on-visit:\d+:\d+/,
      hasCodeFrame: false,
    })

    verify('sync app exception', {
      uncaught: true,
      command: 'click',
      originalMessage: 'sync error',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
      regex: /localhost\:\d+\/cypress\/fixtures\/errors.html:\d+:\d+/,
      hasCodeFrame: false,
    })

    verify('exception inside uncaught:exception', {
      uncaught: true,
      uncaughtMessage: 'sync error',
      column: 12,
      originalMessage: 'bar is not a function',
      message: [
        'The following error originated from your test code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify('async app exception', {
      uncaught: true,
      originalMessage: 'async error',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
      regex: /localhost\:\d+\/cypress\/fixtures\/errors.html:\d+:\d+/,
      hasCodeFrame: false,
    })

    verify('app unhandled rejection', {
      uncaught: true,
      originalMessage: 'promise rejection',
      message: [
        'The following error originated from your application code',
        'It was caused by an unhandled promise rejection',
      ],
      regex: /localhost\:\d+\/cypress\/fixtures\/errors.html:\d+:\d+/,
      hasCodeFrame: false,
    })

    verify('async spec exception', {
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

    verify('async spec exception with done', {
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

    verify('spec unhandled rejection', {
      uncaught: true,
      column: 20,
      originalMessage: 'Unhandled promise rejection from the spec',
      message: [
        'The following error originated from your test code',
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify('spec unhandled rejection with done', {
      uncaught: true,
      column: 20,
      originalMessage: 'Unhandled promise rejection from the spec',
      message: [
        'The following error originated from your test code',
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify('spec Bluebird unhandled rejection', {
      uncaught: true,
      column: 21,
      originalMessage: 'Unhandled promise rejection from the spec',
      message: [
        'The following error originated from your test code',
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify('spec Bluebird unhandled rejection with done', {
      uncaught: true,
      column: 21,
      originalMessage: 'Unhandled promise rejection from the spec',
      message: [
        'The following error originated from your test code',
        'It was caused by an unhandled promise rejection',
      ],
    })
  })

  it('uncaught errors: outside test', () => {
    const verify = loadSpec({
      fileName: 'uncaught_outside_test.cy.js',
      onLoadStatsMessage: 'Failed:1',
    })

    // NOTE: the following 2 test don't have uncaught: true because we don't
    // display command logs if there are only events and not true commands
    // and uncaught: true causes the verification to look for the error
    // event command log
    verify('An uncaught error was detected outside of a test', {
      column: 7,
      message: [
        'The following error originated from your test code',
        'error from outside test',
        'Cypress could not associate this error to any specific test',
      ],
      codeFrameText: `thrownewError('error from outside test')`,
    })
  })

  it('uncaught errors: outside test only suite', () => {
    const verify = loadSpec({
      fileName: 'uncaught_outside_test_only_suite.cy.js',
      onLoadStatsMessage: 'Failed:1',
    })

    verify('An uncaught error was detected outside of a test', {
      column: 7,
      message: [
        'error from outside test with only suite',
        'The following error originated from your test code',
        'Cypress could not associate this error to any specific test',
      ],
      codeFrameText: `thrownewError('error from outside test with only suite')`,
    })
  })

  it('custom commands', () => {
    const verify = loadSpec({
      fileName: 'custom_commands.cy.js',
      onLoadStatsMessage: 'Failed:3',
    })

    verify('assertion failure', {
      column: 23,
      message: `expected 'actual' to equal 'expected'`,
      codeFrameText: `add('failAssertion'`,
    })

    verify('exception', {
      column: 8,
      message: 'bar is not a function',
      codeFrameText: `add('failException'`,
    })

    verify('command failure', {
      column: 6,
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
      codeFrameText: `add('failCommand'`,
    })
  })

  it('typescript', () => {
    const verify = loadSpec({
      fileName: 'typescript.cy.ts',
      onLoadStatsMessage: 'Failed:3',
    })

    verify('assertion failure', {
      column: 25,
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('exception', {
      column: 10,
      message: 'bar is not a function',
    })

    verify('command failure', {
      column: 8,
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
      codeFrameText: `.get('#does-not-exist')`,
    })
  })

  context('docs url', () => {
    before(() => {
      // @ts-ignore
      window.top.__cySkipValidateConfig = true
    })

    after(() => {
      // @ts-ignore
      window.top.__cySkipValidateConfig = false
    })

    it('docs url validation', { retries: 1 }, () => {
      const docsUrl = 'https://on.cypress.io/viewport'

      const verify = loadSpec({
        fileName: 'docs_url.cy.js',
        onLoadStatsMessage: 'Failed:2',
      })

      verify('displays as link in interactive mode', {
        verifyFn () {
          cy.contains('.runnable-title', 'displays as link in interactive mode')
          .closest('.runnable').within(() => {
            cy
            .get('.runnable-err-message')
            .should('not.contain', docsUrl)
            .contains('Learn more')
            .should('have.attr', 'href', docsUrl)
          })
        },
      })

      verify('is text in error message in run mode', {
        verifyFn () {
          cy.contains('.runnable-title', 'is text in error message in run mode')
          .closest('.runnable').within(() => {
            cy
            .get('.runnable-err-message')
            .should('contain', docsUrl)
            .contains('Learn more')
            .should('not.exist')
          })
        },
      })
    })
  })

  // cases where there is a bug in Cypress and we should show cypress internals
  // instead of the invocation stack. we test this by monkey-patching internal
  // methods to make them throw an error
  it('unexpected errors', () => {
    const verify = loadSpec({
      fileName: 'unexpected.cy.js',
      onLoadStatsMessage: 'Failed:1',
    })

    // FIXME: the eval doesn't seem to take effect and overwrite the method
    // so it ends up not failing properly
    // verify('Cypress method error', {
    //   verifyFn: verifyInternalFailure,
    //   method: 'Cypress.LocalStorage._isSpecialKeyword',
    // })

    verify('internal cy error', {
      verifyFn: verifyInternalFailure,
      method: 'cy.expect',
    })
  })
})
