/**
 * See comment at top of various_failures_spec_1.js for more info
 * This covers the same errors but inside custom commands
 */

import { setup, fail, verify, verifyInternalError } from '../support/util'

setup({
  idePath: {
    relative: 'cypress/support/commands.js',
    absolute: /\/[^\/]+\/cypress\/support\/commands\.js/,
  },
  verifyStackLineIsSpecFile: false,
})

context('cy.server', function () {
  describe('onAbort assertion failure', function (done) {
    fail(this, () => {
      cy.failServerOnAbortAssertion()
    })

    verify(this, {
      column: 27,
      codeFrameText: 'onAbort',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onAbort exception', function (done) {
    fail(this, () => {
      cy.failServerOnAbortException()
    })

    verify(this, {
      column: 12,
      codeFrameText: 'onAbort',
      message: 'bar is not a function',
    })
  })

  describe('onRequest assertion failure', function (done) {
    fail(this, () => {
      cy.failServerOnRequestAssertion()
    })

    verify(this, {
      column: 27,
      codeFrameText: 'onRequest',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onRequest exception', function (done) {
    fail(this, () => {
      cy.failServerOnRequestException()
    })

    verify(this, {
      column: 12,
      codeFrameText: 'onRequest',
      message: 'bar is not a function',
    })
  })

  describe('onResponse assertion failure', function (done) {
    fail(this, () => {
      cy.failServerOnResponseAssertion()
    })

    verify(this, {
      column: 27,
      codeFrameText: 'onResponse',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onResponse exception', function (done) {
    fail(this, () => {
      cy.failServerOnResponseException()
    })

    verify(this, {
      column: 12,
      codeFrameText: 'onResponse',
      message: 'bar is not a function',
    })
  })
})

context('cy.readFile', function () {
  describe('existence failure', function () {
    fail(this, () => {
      cy.failReadFileExistence()
      // give server time to determine file does not exist and return ENOENT
      // otherwise, the command times out driver-side
    }, { timeout: 8000 })

    verify(this, {
      column: 6,
      codeFrameText: 'failReadFileExistence',
      message: 'failed because the file does not exist',
    })
  })
})

context('validation errors', function () {
  describe('from cypress', function () {
    fail(this, () => {
      cy.cypressValidationError()
    })

    verify(this, {
      column: 6,
      codeFrameText: 'add(\'cypressValidationError\'',
      message: 'can only accept a string preset or',
      stack: ['throwErrBadArgs', 'From Your Spec Code:'],
    })
  })

  describe('from chai expect', function () {
    fail(this, () => {
      cy.chaiExpectValidationError()
    })

    verify(this, {
      column: '(3|10)', // different between chrome & firefox
      codeFrameText: 'add(\'chaiExpectValidationError\'',
      message: 'Invalid Chai property: nope',
      stack: ['proxyGetter', 'From Your Spec Code:'],
    })
  })

  describe('from chai assert', function () {
    fail(this, () => {
      cy.chaiAssertValidationError()
    })

    verify(this, {
      column: 10,
      codeFrameText: 'add(\'chaiAssertValidationError\'',
      message: 'object tested must be an array',
    })
  })
})

context('event handlers', function () {
  describe('event assertion failure', function () {
    fail(this, () => {
      cy.failEventHandlerAssertion()
    })

    verify(this, {
      column: 25,
      codeFrameText: 'failEventHandlerAssertion',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('event exception', function () {
    fail(this, () => {
      cy.failEventHandlerException()
    })

    verify(this, {
      column: 10,
      codeFrameText: 'failEventHandlerException',
      message: 'bar is not a function',
    })
  })

  describe('fail handler assertion failure', function () {
    fail(this, () => {
      cy.failFailHandlerAssertion()
    })

    verify(this, {
      column: 25,
      codeFrameText: 'failFailHandlerAssertion',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('fail handler exception', function () {
    fail(this, () => {
      cy.failFailHandlerException()
    })

    verify(this, {
      column: 10,
      codeFrameText: 'failFailHandlerException',
      message: 'bar is not a function',
    })
  })
})

context('uncaught errors', () => {
  describe('sync app exception', function () {
    fail(this, () => {
      cy.failSyncAppException()
    })

    verify(this, {
      message: [
        'The following error originated from your application code',
        'qux is not defined',
      ],
      regex: /localhost\:\d+\/js_errors.html:\d+:\d+/,
      hasCodeFrame: false,
      verifyOpenInIde: false,
    })
  })

  describe('async app exception', function () {
    fail(this, () => {
      cy.failAsyncAppException()
    })

    verify(this, {
      message: [
        'The following error originated from your application code',
        'qax is not defined',
      ],
      regex: /localhost\:\d+\/js_errors.html:\d+:\d+/,
      hasCodeFrame: false,
      verifyOpenInIde: false,
    })
  })

  describe('async exception', function () {
    fail(this, () => {
      cy.failAsyncException()
    })

    verify(this, {
      column: 10,
      message: [
        'bar is not a function',
        'The following error originated from your test code',
      ],
      codeFrameText: 'failAsyncException',
    })
  })

  describe('async exception with done', function () {
    fail(this, (done) => {
      cy.failAsyncException()
    })

    verify(this, {
      column: 10,
      message: [
        'bar is not a function',
        'The following error originated from your test code',
      ],
      codeFrameText: 'failAsyncException',
    })
  })
})

// covering cases where there is a bug in Cypress and we shouldn't show
// the invocation stack. it should show the original stack even if it is
// thrown within a command
context('unexpected errors', () => {
  describe('Cypress method error', function () {
    const isJquery = Cypress.dom.isJquery

    beforeEach(() => {
      Cypress.dom.isJquery = isJquery
    })

    fail(this, () => {
      cy.failInternalCypressMethod()
    })

    verifyInternalError(this, {
      method: 'Cypress.dom.isJquery',
    })
  })

  describe('cy method error', function () {
    const cyExpect = cy.expect

    beforeEach(() => {
      cy.expect = cyExpect
    })

    fail(this, () => {
      cy.failInternalCyMethod()
    })

    verifyInternalError(this, {
      method: 'cy.expect',
    })
  })
})
