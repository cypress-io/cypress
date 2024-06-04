import * as specLoader from './support/spec-loader'
import { createVerify } from './support/verify-failures'

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
  it('assertion failures', () => {
    const verify = loadErrorSpec({
      filePath: 'errors/assertions.cy.js',
      hasPreferredIde: true,
      failCount: 3,
    })

    verify('with expect().<foo>', {
      line: 3,
      column: 25,
      message: `expected 'actual' to equal 'expected'`,
      verifyOpenInIde: true,
    })

    verify('with assert()', {
      line: 7,
      column: [5, 12], // [chrome, firefox]
      message: `should be true`,
      verifyOpenInIde: true,
    })

    verify('with assert.<foo>()', {
      line: 11,
      column: 12,
      message: `expected 'actual' to equal 'expected'`,
      verifyOpenInIde: true,
    })
  })

  it('assertion failures - no preferred IDE', () => {
    const verify = loadErrorSpec({
      filePath: 'errors/assertions.cy.js',
      failCount: 3,
    })

    verify('with expect().<foo>', {
      column: 25,
      message: `expected 'actual' to equal 'expected'`,
      codeFrameText: 'with expect().<foo>',
      verifyOpenInIde: true,
    })
  })

  it('commands', () => {
    const verify = loadErrorSpec({
      filePath: 'errors/commands.cy.js',
      failCount: 2,
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
    const verify = loadErrorSpec({
      filePath: 'errors/then.cy.js',
      failCount: 3,
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
    const verify = loadErrorSpec({
      filePath: 'errors/should.cy.js',
      failCount: 8,
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
    const verify = loadErrorSpec({
      filePath: 'errors/each.cy.js',
      failCount: 3,
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
    const verify = loadErrorSpec({
      filePath: 'errors/spread.cy.js',
      failCount: 3,
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
    const verify = loadErrorSpec({
      filePath: 'errors/within.cy.js',
      failCount: 3,
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
    const verify = loadErrorSpec({
      filePath: 'errors/wrap.cy.js',
      failCount: 3,
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
    const verify = loadErrorSpec({
      filePath: 'errors/visit.cy.js',
      failCount: 3,
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

  // FIXME: @see https://github.com/cypress-io/cypress/issues/29614
  // projects using Typescript 5 do not calculate the userInvocationStack correctly,
  // leading to a small mismatch when linking stack traces back to the user's IDE from
  // the command log.
  it('cy.intercept', () => {
    const verify = loadErrorSpec({
      filePath: 'errors/intercept.cy.ts',
      failCount: 3,
    })

    verify('assertion failure in request callback', {
      message: [
        `expected 'a' to equal 'b'`,
      ],
      notInMessage: [
        'The following error originated from your spec code',
      ],
    })

    verify('assertion failure in response callback', {
      codeFrameText: '.reply(function()',
      message: [
        `expected 'b' to equal 'c'`,
      ],
      notInMessage: [
        'The following error originated from your spec code',
      ],
    })

    verify('fails when erroneous response is received while awaiting response', {
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
    })

    verify('from cypress', {
      column: 8,
      message: 'can only accept a string preset or',
      stack: ['throwErrBadArgs', 'From Your Spec Code:'],
    })

    verify('from chai expect', {
      column: [5, 12], // [chrome, firefox]
      message: 'Invalid Chai property: nope',
      stack: ['proxyGetter', 'From Your Spec Code:'],
    })

    verify('from chai assert', {
      column: 12,
      message: 'object tested must be an array',
    })
  })

  it('event handlers', () => {
    const verify = loadErrorSpec({
      filePath: 'errors/events.cy.js',
      failCount: 4,
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

  it('custom commands', () => {
    const verify = loadErrorSpec({
      filePath: 'errors/custom_commands.cy.js',
      failCount: 3,
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
})
