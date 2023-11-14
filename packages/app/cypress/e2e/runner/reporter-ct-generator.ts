import * as specLoader from './support/spec-loader'
import { createVerify, verifyInternalFailure } from './support/verify-failures'

type VerifyFunc = (specTitle: string, verifyOptions: any) => void

/**
   * Navigates to desired error spec file within Cypress app and waits for completion.
   * Returns scoped verify function to aid inner spec validation.
   */
function loadErrorSpec (options: specLoader.LoadSpecOptions, configFile: string): VerifyFunc {
  const DefaultOptions: Partial<specLoader.LoadSpecOptions> = {
    projectName: 'runner-ct-specs',
    mode: 'component',
    configFile,
  }

  const effectiveOptions = {
    ...DefaultOptions,
    ...options,
  }

  const {
    filePath,
    hasPreferredIde = false,
    mode,
  } = effectiveOptions

  specLoader.loadSpec(effectiveOptions)

  // Return scoped verify function with spec options baked in
  return createVerify({ fileName: Cypress._.last(filePath.split('/')), hasPreferredIde, mode })
}

/**
 * Generate CT error reporting specs for a given dev server - have to structure this way to avoid
 * Out of Memory issues if they're all contained in a single spec
 *
 * @param server 'Vite' | 'Webpack'
 * @param configFile config file
 */
export const generateCtErrorTests = (server: 'Webpack' | 'Vite', configFile: string) => {
  describe(`${server} - errors ui`, {
    viewportHeight: 768,
    viewportWidth: 1024,
    // Limiting tests kept in memory due to large memory cost
    // of nested spec snapshots
    numTestsKeptInMemory: 1,
  }, () => {
    it('assertion failures', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/assertions.cy.js',
        hasPreferredIde: true,
        failCount: 3,
      }, configFile)

      verify('with expect().<foo>', {
        line: 3,
        column: [25, 26],
        message: `expected 'actual' to equal 'expected'`,
      })

      verify('with assert()', {
        line: 7,
        column: [5, 6, 12], // [chrome, firefox]
        message: `should be true`,
      })

      verify('with assert.<foo>()', {
        line: 11,
        column: [12, 13],
        message: `expected 'actual' to equal 'expected'`,
      })
    })

    it('assertion failures - no preferred IDE', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/assertions.cy.js',
        failCount: 3,
      }, configFile)

      verify('with expect().<foo>', {
        column: [25, 26],
        message: `expected 'actual' to equal 'expected'`,
        codeFrameText: 'with expect().<foo>',
      })
    })

    // Vite does not provide the `require` syntax used by this test
    if (server === 'Webpack') {
      it('exception failures', () => {
        const verify = loadErrorSpec({
          filePath: 'errors/exceptions.cy.js',
          failCount: 2,
        }, configFile)

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
    }

    it('hooks', { viewportHeight: 900 }, () => {
      const verify = loadErrorSpec({
        filePath: 'errors/hooks.cy.js',
        failCount: 1,
      }, configFile)

      // https://github.com/cypress-io/cypress/issues/8214
      // https://github.com/cypress-io/cypress/issues/8288
      // https://github.com/cypress-io/cypress/issues/8350
      verify('test', {
        column: [7, 8, 18], // [chrome, firefox]
        codeFrameText: 'beforeEach(()=>',
        message: `Cypress detected you registered a(n) beforeEach hook while a test was running`,
      })
    })

    it('commands', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/commands.cy.js',
        failCount: 2,
      }, configFile)

      verify('failure', {
        column: [8, 9],
        message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
      })

      verify('chained failure', {
        column: [20, 21],
        message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
      })
    })

    it('cy.then', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/then.cy.js',
        failCount: 3,
      }, configFile)

      verify('assertion failure', {
        column: [27, 28],
        message: `expected 'actual' to equal 'expected'`,
      })

      verify('exception', {
        column: [12, 13],
        message: 'bar is not a function',
      })

      verify('command failure', {
        column: [10, 11],
        message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
      })
    })

    it('cy.should', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/should.cy.js',
        failCount: 8,
      }, configFile)

      verify('callback assertion failure', {
        column: [27, 28],
        message: `expected 'actual' to equal 'expected'`,
      })

      verify('callback exception', {
        column: [12, 13],
        message: 'bar is not a function',
      })

      verify('standard assertion failure', {
        column: [6, 7],
        message: 'Timed out retrying after 0ms: expected {} to have property \'foo\'',
      })

      verify('after multiple', {
        column: [6, 7],
        message: 'Timed out retrying after 0ms: expected \'foo\' to equal \'bar\'',
      })

      verify('after multiple callbacks exception', {
        column: [12, 13],
        codeFrameText: '({}).bar()',
        message: 'bar is not a function',
      })

      verify('after multiple callbacks assertion failure', {
        column: [27, 28],
        codeFrameText: '.should(()=>',
        message: `expected 'actual' to equal 'expected'`,
      })

      verify('after callback success assertion failure', {
        column: [6, 7],
        codeFrameText: '.should(\'have.property',
        message: `expected {} to have property 'foo'`,
      })

      verify('command failure after success', {
        column: [8, 9],
        message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
      })
    })

    it('cy.each', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/each.cy.js',
        failCount: 3,
      }, configFile)

      verify('assertion failure', {
        column: [27, 28],
        message: `expected 'actual' to equal 'expected'`,
      })

      verify('exception', {
        column: [12, 13],
        message: 'bar is not a function',
      })

      verify('command failure', {
        column: [10, 11],
        message: 'Expected to find element: #does-not-exist, but never found it',
      })
    })

    it('cy.spread', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/spread.cy.js',
        failCount: 3,
      }, configFile)

      verify('assertion failure', {
        column: [27, 28],
        message: `expected 'actual' to equal 'expected'`,
      })

      verify('exception', {
        column: [12, 13],
        message: 'bar is not a function',
      })

      verify('command failure', {
        column: [10, 11],
        message: 'Expected to find element: #does-not-exist, but never found it',
      })
    })

    it('cy.within', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/within.cy.js',
        failCount: 3,
      }, configFile)

      verify('assertion failure', {
        column: [27, 28],
        message: `expected 'actual' to equal 'expected'`,
      })

      verify('exception', {
        column: [12, 13],
        message: 'bar is not a function',
      })

      verify('command failure', {
        column: [10, 11],
        message: 'Expected to find element: #does-not-exist, but never found it',
      })
    })

    it('cy.wrap', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/wrap.cy.js',
        failCount: 3,
      }, configFile)

      verify('assertion failure', {
        column: [27, 28],
        message: `expected 'actual' to equal 'expected'`,
      })

      verify('exception', {
        column: [12, 13],
        message: 'bar is not a function',
      })

      verify('command failure', {
        column: [10, 11],
        message: 'Expected to find element: #does-not-exist, but never found it',
      })
    })

    it('cy.intercept', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/intercept.cy.ts',
        failCount: 3,
      }, configFile)

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

    it('validation errors', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/validation.cy.js',
        failCount: 3,
      }, configFile)

      verify('from cypress', {
        column: [8, 9],
        message: 'can only accept a string preset or',
        stack: ['throwErrBadArgs', 'From Your Spec Code:'],
      })

      verify('from chai expect', {
        column: [5, 6, 12], // [chrome, firefox]
        message: 'Invalid Chai property: nope',
        stack: ['proxyGetter', 'From Your Spec Code:'],
      })

      verify('from chai assert', {
        column: [12, 13],
        message: 'object tested must be an array',
      })
    })

    it('event handlers', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/events.cy.js',
        failCount: 4,
      }, configFile)

      verify('event assertion failure', {
        column: [27, 28],
        message: `expected 'actual' to equal 'expected'`,
      })

      verify('event exception', {
        column: [12, 13],
        message: 'bar is not a function',
      })

      verify('fail handler assertion failure', {
        column: [27, 28],
        message: `expected 'actual' to equal 'expected'`,
      })

      verify('fail handler exception', {
        column: [12, 13],
        message: 'bar is not a function',
      })
    })

    it('custom commands', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/custom_commands.cy.js',
        failCount: 3,
      }, configFile)

      verify('assertion failure', {
        column: [23, 24],
        message: `expected 'actual' to equal 'expected'`,
        codeFrameText: `add('failAssertion'`,
      })

      verify('exception', {
        column: [8, 9],
        message: 'bar is not a function',
        codeFrameText: `add('failException'`,
      })

      verify('command failure', {
        column: [6, 7],
        message: 'Timed out retrying after 0ms: Expected to find element: #does-not-exist, but never found it',
        codeFrameText: `add('failCommand'`,
      })
    })

    it('typescript', () => {
      const verify = loadErrorSpec({
        filePath: 'errors/typescript.cy.ts',
        failCount: 3,
      }, configFile)

      verify('assertion failure', {
        column: [25, 26],
        message: `expected 'actual' to equal 'expected'`,
      })

      verify('exception', {
        column: [10, 11],
        message: 'bar is not a function',
      })

      verify('command failure', {
        column: [8, 9],
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
        }, configFile)

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
      }, configFile)

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
}

export const generateCtUncaughtErrorTests = (server: 'Webpack' | 'Vite', configFile: string) => {
  it('uncaught errors', () => {
    const verify = loadErrorSpec({
      filePath: 'errors/uncaught-ct.cy.js',
      failCount: 11,
    }, configFile)

    verify('sync app mount exception', {
      uncaught: true,
      originalMessage: 'mount error',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
      regex: /src\/Errors.jsx/,
      hasCodeFrame: false,
    })

    verify('sync app exception after mount', {
      uncaught: true,
      originalMessage: 'sync error',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
      regex: /src\/Errors.jsx/,
      hasCodeFrame: false,
    })

    verify('exception inside uncaught:exception', {
      uncaught: true,
      uncaughtMessage: 'mount error',
      column: [5, 6, 12],
      originalMessage: 'bar is not a function',
      message: [
        'The following error originated from your test code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify('async app exception after mount', {
      uncaught: true,
      originalMessage: 'async error',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
      regex: /src\/Errors.jsx/,
      hasCodeFrame: false,
    })

    verify('app unhandled rejection', {
      uncaught: true,
      originalMessage: 'promise rejection',
      message: [
        'The following error originated from your application code',
        'It was caused by an unhandled promise rejection',
      ],
      regex: /src\/Errors.jsx/,
      hasCodeFrame: false,
    })

    verify('async spec exception', {
      uncaught: true,
      column: [3, 5, 12],
      originalMessage: 'bar is not a function',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify('async spec exception with done', {
      uncaught: true,
      column: [3, 6, 12],
      originalMessage: 'bar is not a function',
      message: [
        'The following error originated from your application code',
      ],
      notInMessage: [
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify('spec unhandled rejection', {
      uncaught: true,
      column: [20, 21],
      originalMessage: 'Unhandled promise rejection from the spec',
      message: [
        'The following error originated from your application code',
        'It was caused by an unhandled promise rejection',
      ],
    })

    verify('spec unhandled rejection with done', {
      uncaught: true,
      column: [20, 21],
      originalMessage: 'Unhandled promise rejection from the spec',
      message: [
        'The following error originated from your application code',
        'It was caused by an unhandled promise rejection',
      ],
      hasCodeFrame: server !== 'Vite',
    })

    verify('spec Bluebird unhandled rejection', {
      uncaught: true,
      column: [21, 22],
      originalMessage: 'Unhandled promise rejection from the spec',
      message: [
        'The following error originated from your application code',
        'It was caused by an unhandled promise rejection',
      ],
      hasCodeFrame: server !== 'Vite',
    })

    verify('spec Bluebird unhandled rejection with done', {
      uncaught: true,
      column: [21, 22],
      originalMessage: 'Unhandled promise rejection from the spec',
      message: [
        'The following error originated from your application code',
        'It was caused by an unhandled promise rejection',
      ],
      hasCodeFrame: server !== 'Vite',
    })
  })

  it('uncaught errors: outside test', () => {
    const verify = loadErrorSpec({
      filePath: 'errors/uncaught_outside_test.cy.js',
      failCount: 1,
    }, configFile)

    // NOTE: the following 2 test don't have uncaught: true because we don't
    // display command logs if there are only events and not true commands
    // and uncaught: true causes the verification to look for the error
    // event command log
    verify('An uncaught error was detected outside of a test', {
      column: [7, 8],
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
    }, configFile)

    verify('An uncaught error was detected outside of a test', {
      column: [7, 8],
      message: [
        'error from outside test with only suite',
        'The following error originated from your test code',
        'Cypress could not associate this error to any specific test',
      ],
      codeFrameText: `thrownewError('error from outside test with only suite')`,
    })
  })
}
