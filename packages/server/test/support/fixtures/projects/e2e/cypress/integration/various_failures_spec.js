/**
 * This tests various failure scenarios where an error and code frame is displayed
 * It does this by having a test fail and then a subsequent test run that
 * tests the appearance of the command log
 * Because of this, the test order is important
 * There should be the same number of failing tests as there are passing
 * tests, because each failure has a verification test (e.g. 11 fail, 11 pass)
 */
import outsideError from '../../../todos/throws-error'
import {
  fail,
  verify,
  verifyInternalError,
  setup,
  sendXhr,
  abortXhr,
} from '../support/util'

setup({ verifyStackLineIsSpecFile: true })

context('assertion failures', function () {
  describe('with expect().<foo>', function () {
    fail(this, () => {
      expect('actual').to.equal('expected')
    })

    verify(this, {
      column: 27,
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('with assert()', function () {
    fail(this, () => {
      assert(false, 'should be true')
    })

    verify(this, {
      column: '(7|14)', // different between chrome & firefox
      message: 'should be true',
    })
  })

  describe('with assert.<foo>()', function () {
    fail(this, () => {
      assert.equal('actual', 'expected')
    })

    verify(this, {
      column: 14,
      message: `expected 'actual' to equal 'expected'`,
    })
  })
})

context('exceptions', function () {
  describe('in spec file', function () {
    fail(this, () => {
      ({}).bar()
    })

    verify(this, {
      column: 12,
      message: 'bar is not a function',
    })
  })

  describe('in file outside project', function () {
    fail(this, () => {
      outsideError()
    })

    verify(this, {
      message: 'An outside error',
      regex: /todos\/throws\-error\.js:5:9/,
      codeFrameText: `thrownewError('An outside error')`,
      verifyOpenInIde: false,
    })
  })
})

context('commands', function () {
  describe('failure', function () {
    fail(this, () => {
      cy.get('#does-not-exist')
    })

    verify(this, {
      column: 10,
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('chained failure', function () {
    fail(this, () => {
      cy.get('body').find('#does-not-exist')
    })

    verify(this, {
      column: 22,
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.then', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.wrap({}).then(() => {
        expect('actual').to.equal('expected')
      })
    })

    verify(this, {
      column: 29,
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('exception', function () {
    fail(this, () => {
      cy.wrap({}).then(() => {
        ({}).bar()
      })
    })

    verify(this, {
      column: 14,
      message: 'bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.wrap({}).then(() => {
        cy.get('#does-not-exist')
      })
    })

    verify(this, {
      column: 12,
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.should', function () {
  describe('callback assertion failure', function () {
    fail(this, () => {
      cy.wrap({}).should(() => {
        expect('actual').to.equal('expected')
      })
    })

    verify(this, {
      column: 29,
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('callback exception', function () {
    fail(this, () => {
      cy.wrap({}).should(() => {
        ({}).bar()
      })
    })

    verify(this, {
      column: 14,
      message: 'bar is not a function',
    })
  })

  describe('assertion failure', function () {
    fail(this, () => {
      cy.wrap({})
      .should('have.property', 'foo')
    })

    verify(this, {
      column: 8,
      message: 'Timed out retrying: expected {} to have property \'foo\'',
    })
  })

  describe('after multiple', function () {
    fail(this, () => {
      cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
      .should('equal', 'bar')
    })

    verify(this, {
      column: 8,
      message: 'Timed out retrying: expected \'foo\' to equal \'bar\'',
    })
  })

  describe('after multiple callbacks exception', function () {
    fail(this, () => {
      cy.wrap({ foo: 'foo' })
      .should(() => {
        expect(true).to.be.true
      })
      .should(() => {
        ({}).bar()
      })
    })

    verify(this, {
      column: 14,
      codeFrameText: '({}).bar()',
      message: 'bar is not a function',
    })
  })

  describe('after multiple callbacks assertion failure', function () {
    fail(this, () => {
      cy.wrap({ foo: 'foo' })
      .should(() => {
        expect(true).to.be.true
      })
      .should(() => {
        expect('actual').to.equal('expected')
      })
    })

    verify(this, {
      column: 29,
      codeFrameText: '.should(()=>',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('after callback success assertion failure', function () {
    fail(this, () => {
      cy.wrap({})
      .should(() => {
        expect(true).to.be.true
      })
      .should('have.property', 'foo')
    })

    verify(this, {
      column: 8,
      codeFrameText: '.should(\'have.property',
      message: `expected {} to have property 'foo'`,
    })
  })

  describe('command failure after success', function () {
    fail(this, () => {
      cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
      cy.get('#does-not-exist')
    })

    verify(this, {
      column: 10,
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.each', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.wrap([1]).each(() => {
        expect('actual').to.equal('expected')
      })
    })

    verify(this, {
      column: 29,
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('exception', function () {
    fail(this, () => {
      cy.wrap([1]).each(() => {
        ({}).bar()
      })
    })

    verify(this, {
      column: 14,
      message: 'bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.wrap([1]).each(() => {
        cy.get('#does-not-exist')
      })
    })

    verify(this, {
      column: 12,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.spread', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.wrap([1, 2, 3]).spread(() => {
        expect('actual').to.equal('expected')
      })
    })

    verify(this, {
      column: 29,
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('exception', function () {
    fail(this, () => {
      cy.wrap([1, 2, 3]).spread(() => {
        ({}).bar()
      })
    })

    verify(this, {
      column: 14,
      message: 'bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.wrap([1, 2, 3]).spread(() => {
        cy.get('#does-not-exist')
      })
    })

    verify(this, {
      column: 12,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.within', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.get('body').within(() => {
        expect('actual').to.equal('expected')
      })
    })

    verify(this, {
      column: 29,
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('exception', function () {
    fail(this, () => {
      cy.get('body').within(() => {
        ({}).bar()
      })
    })

    verify(this, {
      column: 14,
      message: 'bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.get('body').within(() => {
        cy.get('#does-not-exist')
      })
    })

    verify(this, {
      column: 12,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.wrap', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.wrap(() => {
        expect('actual').to.equal('expected')
      }).then((fn) => fn())
    })

    verify(this, {
      column: 29,
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('exception', function () {
    fail(this, () => {
      cy.wrap(() => {
        ({}).bar()
      }).then((fn) => fn())
    })

    verify(this, {
      column: 14,
      message: 'bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.wrap(() => {
        cy.get('#does-not-exist')
      }).then((fn) => fn())
    })

    verify(this, {
      column: 12,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.visit', () => {
  describe('onBeforeLoad assertion failure', function () {
    fail(this, () => {
      cy.visit('/index.html', {
        onBeforeLoad () {
          expect('actual').to.equal('expected')
        },
      })
    })

    verify(this, {
      column: 31,
      codeFrameText: 'onBeforeLoad',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onBeforeLoad exception', function () {
    fail(this, () => {
      cy.visit('/index.html', {
        onBeforeLoad () {
          ({}).bar()
        },
      })
    })

    verify(this, {
      column: 16,
      codeFrameText: 'onBeforeLoad',
      message: 'bar is not a function',
    })
  })

  describe('onLoad assertion failure', function () {
    fail(this, () => {
      cy.visit('/index.html', {
        onLoad () {
          expect('actual').to.equal('expected')
        },
      })
    })

    verify(this, {
      column: 31,
      codeFrameText: 'onLoad',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onLoad exception', function () {
    fail(this, () => {
      cy.visit('/index.html', {
        onLoad () {
          ({}).bar()
        },
      })
    })

    verify(this, {
      column: 16,
      codeFrameText: 'onLoad',
      message: 'bar is not a function',
    })
  })
})

context('cy.route', () => {
  describe('callback assertion failure', function () {
    fail(this, () => {
      cy.server().route(() => {
        expect('actual').to.equal('expected')
      })
    })

    verify(this, {
      column: 29,
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('callback exception', function () {
    fail(this, () => {
      cy.server().route(() => {
        ({}).bar()
      })
    })

    verify(this, {
      column: 14,
      message: 'bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.server().route(() => {
        cy.get('#does-not-exist')

        return '/foo'
      })
    })

    verify(this, {
      column: 12,
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('onAbort assertion failure', function (done) {
    fail(this, () => {
      cy.server().route({
        url: '/foo',
        onAbort () {
          expect('actual').to.equal('expected')
        },
      })
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
      cy.server().route({
        url: '/foo',
        onAbort () {
          ({}).bar()
        },
      })
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
      cy.server().route({
        url: '/foo',
        onRequest () {
          expect('actual').to.equal('expected')
        },
      })
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
      cy.server().route({
        url: '/foo',
        onRequest () {
          ({}).bar()
        },
      })
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
      cy.server().route({
        url: '/users',
        onResponse () {
          expect('actual').to.equal('expected')
        },
      })
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
      cy.server().route({
        url: '/users',
        onResponse () {
          ({}).bar()
        },
      })
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
      cy.readFile('does-not-exist', { timeout: 0 })
    })

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
