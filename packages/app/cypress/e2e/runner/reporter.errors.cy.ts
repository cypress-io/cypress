import * as specLoader from './support/spec-loader'
import { createVerify, verifyInternalFailure } from './support/verify-failures'

type VerifyFunc = (specTitle: string, verifyOptions: any) => void

/**
 * Navigates to desired error spec file within Cypress app and waits for completion.
 * Returns scoped verify function to aid inner spec validation.
 */
function loadErrorSpec (options: specLoader.LoadSpecOptions): VerifyFunc {
  const {
    filePath,
    hasPreferredIde = false,
    mode,
  } = options

  specLoader.loadSpec(options)

  // Return scoped verify function with spec options baked in
  return createVerify({ fileName: Cypress._.last(filePath.split('/')), hasPreferredIde, mode })
}

describe('errors ui', {
  viewportHeight: 768,
  viewportWidth: 1024,
  // Limiting tests kept in memory due to large memory cost
  // of nested spec snapshots
  numTestsKeptInMemory: 0,
}, () => {
  it('exception failures', () => {
    const verify = loadErrorSpec({
      filePath: 'errors/exceptions.cy.js',
      failCount: 2,
    })

    verify('in spec file', {
      column: 10,
      message: 'bar is not a function',
    })

    verify('in file outside project', {
      message: 'An outside error',
      stackRegex: /\/throws\-error\.js:5:8/,
      codeFrameRegex: /\/throws\-error\.js:5:9/,
      codeFrameText: `thrownewError('An outside error')`,
    })
  })

  it('hooks', { viewportHeight: 900 }, () => {
    const verify = loadErrorSpec({
      filePath: 'errors/hooks.cy.js',
      failCount: 1,
    })

    // https://github.com/cypress-io/cypress/issues/8214
    // https://github.com/cypress-io/cypress/issues/8288
    // https://github.com/cypress-io/cypress/issues/8350
    verify('test', {
      column: [7, 18], // [chrome, firefox]
      codeFrameText: 'beforeEach(()=>',
      message: `Cypress detected you registered a(n) beforeEach hook while a test was running`,
    })
  })

  it('uncaught errors', () => {
    const verify = loadErrorSpec({
      filePath: 'errors/uncaught.cy.js',
      failCount: 11,
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

    verify('spec unhandled rejection with string content', {
      uncaught: true,
      column: 20,
      originalMessage: 'Unhandled promise rejection with string content from the spec',
      message: [
        'The following error originated from your test code',
        'It was caused by an unhandled promise rejection',
      ],
      stackRegex: /.*/,
      hasCodeFrame: false,
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
    const verify = loadErrorSpec({
      filePath: 'errors/uncaught_outside_test.cy.js',
      failCount: 1,
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
    const verify = loadErrorSpec({
      filePath: 'errors/uncaught_outside_test_only_suite.cy.js',
      failCount: 1,
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

  // FIXME: @see https://github.com/cypress-io/cypress/issues/29614
  // projects using Typescript 5 do not calculate the userInvocationStack correctly,
  // leading to a small mismatch when linking stack traces back to the user's IDE from
  // the command log.
  it('typescript', () => {
    const verify = loadErrorSpec({
      filePath: 'errors/typescript.cy.ts',
      failCount: 3,
    })

    verify('assertion failure', {
      message: `expected 'actual' to equal 'expected'`,
    })

    verify('exception', {
      column: 12,
      message: 'bar is not a function',
    })

    verify('command failure', {
      message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
      codeFrameText: `.get('#does-not-exist')`,
    })
  })

  context('docs url', () => {
    before(() => {
      // docs_url.cy.js manually sets the 'isInteractive' config property in order
      // to test both run and open mode behavior. We need to skip the config validation
      // here in order for this to be possible.
      // @ts-ignore
      window.top.__cySkipValidateConfig = true
    })

    after(() => {
      // @ts-ignore
      window.top.__cySkipValidateConfig = false
    })

    it('docs url validation', { retries: 1 }, () => {
      const docsUrl = 'https://on.cypress.io/viewport'

      const verify = loadErrorSpec({
        filePath: 'errors/docs_url.cy.js',
        failCount: 2,
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
    const verify = loadErrorSpec({
      filePath: 'errors/unexpected.cy.js',
      failCount: 2,
    })

    verify('Cypress method error', {
      verifyFn: verifyInternalFailure,
      method: 'Cypress.LocalStorage.clear',
    })

    verify('internal cy error', {
      verifyFn: verifyInternalFailure,
      method: 'cy.expect',
    })
  })
})
