/**
 * See comment at top of various_failures_spec_1.js for more info
 * This covers the same errors but inside custom commands
 */

import {
  fail,
  verify,
  verifyInternalError,
  setup,
  sendXhr,
  abortXhr,
} from '../support/util'

setup({ verifyStackLineIsSpecFile: true })

context('cy.server', () => {
  describe('onAbort assertion failure', function (done) {
    fail(this, () => {
      cy.server({
        onAbort () {
          expect('actual').to.equal('expected')
        },
      })
      .route('/foo')
      .window().then(abortXhr)
    })

    verify(this, {
      column: 31,
      codeFrameText: 'onAbort',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onAbort exception', function (done) {
    fail(this, () => {
      cy.server({
        onAbort () {
          ({}).bar()
        },
      })
      .route('/foo')
      .window().then(abortXhr)
    })

    verify(this, {
      column: 16,
      codeFrameText: 'onAbort',
      message: 'bar is not a function',
    })
  })

  describe('onRequest assertion failure', function (done) {
    fail(this, () => {
      cy.server({
        onRequest () {
          expect('actual').to.equal('expected')
        },
      })
      .route('/foo')
      .window().then(sendXhr)
    })

    verify(this, {
      column: 31,
      codeFrameText: 'onRequest',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onRequest exception', function (done) {
    fail(this, () => {
      cy.server({
        onRequest () {
          ({}).bar()
        },
      })
      .route('/foo')
      .window().then(sendXhr)
    })

    verify(this, {
      column: 16,
      codeFrameText: 'onRequest',
      message: 'bar is not a function',
    })
  })

  describe('onResponse assertion failure', function (done) {
    fail(this, () => {
      cy.server({
        onResponse () {
          expect('actual').to.equal('expected')
        },
      })
      .route('/users')
      .visit('/xhr.html').get('#fetch').click()
      .wait(10000)
    })

    verify(this, {
      column: 31,
      codeFrameText: 'onResponse',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onResponse exception', function (done) {
    fail(this, () => {
      cy.server({
        onResponse () {
          ({}).bar()
        },
      })
      .route('/users')
      .visit('/xhr.html').get('#fetch').click()
      .wait(10000)
    })

    verify(this, {
      column: 16,
      codeFrameText: 'onResponse',
      message: 'bar is not a function',
    })
  })
})

context('cy.readFile', function () {
  describe('existence failure', function () {
    fail(this, () => {
      cy.readFile('does-not-exist')
      // give server time to determine file does not exist and return ENOENT
      // otherwise, the command times out driver-side
    }, { timeout: 8000 })

    verify(this, {
      column: 10,
      message: 'failed because the file does not exist',
    })
  })
})

context('validation errors', function () {
  describe('from cypress', function () {
    fail(this, () => {
      cy.viewport()
    })

    verify(this, {
      column: 10,
      message: 'can only accept a string preset or',
      stack: ['throwErrBadArgs', 'From Your Spec Code:'],
    })
  })

  describe('from chai expect', function () {
    fail(this, () => {
      expect(true).to.be.nope
    })

    verify(this, {
      column: '(7|14)', // different between chrome & firefox
      message: 'Invalid Chai property: nope',
      stack: ['proxyGetter', 'From Your Spec Code:'],
    })
  })

  describe('from chai assert', function () {
    fail(this, () => {
      assert.deepInclude()
    })

    verify(this, {
      column: 14,
      message: 'object tested must be an array',
    })
  })
})

context('event handlers', function () {
  describe('event assertion failure', function () {
    fail(this, () => {
      cy.on('window:load', () => {
        expect('actual').to.equal('expected')
      })

      cy.visit('http://localhost:1919')
    })

    verify(this, {
      column: 29,
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('event exception', function () {
    fail(this, () => {
      cy.on('window:load', () => {
        ({}).bar()
      })

      cy.visit('http://localhost:1919')
    })

    verify(this, {
      column: 14,
      message: 'bar is not a function',
    })
  })

  describe('fail handler assertion failure', function () {
    fail(this, () => {
      cy.on('fail', () => {
        expect('actual').to.equal('expected')
      })

      cy.get('#does-not-exist')
    })

    verify(this, {
      column: 29,
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('fail handler exception', function () {
    fail(this, () => {
      cy.on('fail', () => {
        ({}).bar()
      })

      cy.get('#does-not-exist')
    })

    verify(this, {
      column: 14,
      message: 'bar is not a function',
    })
  })
})

context('uncaught errors', () => {
  describe('sync app exception', function () {
    fail(this, () => {
      cy.visit('/js_errors.html')
      cy.get('.sync-error').click()
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
      cy.visit('/js_errors.html')
      cy.get('.async-error').click()
      cy.wait(10000)
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
      setTimeout(() => {
        ({}).bar()
      })

      cy.wait(10000)
    })

    verify(this, {
      column: 14,
      message: [
        'bar is not a function',
        'The following error originated from your test code',
      ],
    })
  })

  describe('async exception with done', function () {
    fail(this, (done) => {
      setTimeout(() => {
        ({}).bar()
      }, 20)
    })

    verify(this, {
      column: 14,
      message: [
        'bar is not a function',
        'The following error originated from your test code',
      ],
      codeFrameText: 'fail(this,(done)=>',
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
      top.window.eval(`Cypress.dom.isJquery = () => { throw new Error('thrown in CypressdomisJquery') }`)

      cy.get('body')
    })

    verifyInternalError(this, {
      method: 'Cypress.dom.isJquery',
    })
  })

  describe('internal cy error', function () {
    const cyExpect = cy.expect

    beforeEach(() => {
      cy.expect = cyExpect
    })

    fail(this, () => {
      top.window.eval(`cy.expect = () => { throw new Error('thrown in cyexpect') }`)

      cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
    })

    verifyInternalError(this, {
      method: 'cy.expect',
    })
  })
})
