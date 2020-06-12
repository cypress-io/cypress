/**
 * See comment at top of various_failures_spec_1.js for more info
 * This covers the same errors but inside custom commands
 */

import {
  fail,
  verify,
  setup,
  sendXhr,
  abortXhr,
} from '../support/util'

setup({ verifyStackLineIsSpecFile: true })

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
