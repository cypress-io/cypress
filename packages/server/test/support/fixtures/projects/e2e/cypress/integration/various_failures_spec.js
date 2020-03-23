/**
 * This tests various failure scenarios where an error and code frame is displayed
 * It does this by having a test fail and then a subsequent test run that
 * tests the appearance of the command log
 * Because of this, the test order is important
 * There should be the same number of failing tests as there are passing
 * tests, because each failure has a verification test (e.g. 11 fail, 11 pass)
 */
import outsideError from '../../../todos/throws-error'
import { fail, verify, sendXhr, abortXhr } from '../support/util'

describe('assertion failure', function () {
  fail(this, () => {
    expect(true).to.be.false
    expect(false).to.be.false
  })

  verify(this, {
    column: 5,
    message: 'expected true to be false',
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
    })
  })
})

context('commands', function () {
  describe('failure', function () {
    fail(this, () => {
      cy.get('h1', { timeout: 1 })
    })

    verify(this, {
      column: 10,
      message: 'Timed out retrying: Expected to find element: h1, but never found it',
    })
  })

  describe('chained failure', function () {
    fail(this, () => {
      cy.get('div').find('h1', { timeout: 1 })
    })

    verify(this, {
      column: 21,
      message: 'Timed out retrying: Expected to find element: h1, but never found it',
    })
  })
})

describe('cy.then', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.wrap({}).then(() => {
        expect(true).to.be.false
      })
    })

    verify(this, {
      column: 9,
      message: 'expected true to be false',
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
        cy.get('h1', { timeout: 1 })
      })
    })

    verify(this, {
      column: 12,
      message: 'Timed out retrying: Expected to find element: h1, but never found it',
    })
  })
})

describe('cy.should', function () {
  describe('callback assertion failure', function () {
    fail(this, () => {
      cy.wrap({}).should(() => {
        expect(true).to.be.false
      })
    })

    verify(this, {
      column: 9,
      message: 'expected true to be false',
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
        expect(true).to.be.false
      })
    })

    verify(this, {
      column: 9,
      codeFrameText: '.should(()=>',
      message: 'expected true to be false',
    })
  })

  describe('command after success', function () {
    fail(this, () => {
      cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
      cy.get('h1', { timeout: 1 })
    })

    verify(this, {
      column: 10,
      message: 'Timed out retrying: Expected to find element: h1, but never found it',
    })
  })
})

context('cy.each', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.wrap([1]).each(() => {
        expect(true).to.be.false
      })
    })

    verify(this, {
      column: 9,
      message: 'expected true to be false',
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
      message: '{}.bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.wrap([1]).each(() => {
        cy.get('h1', { timeout: 1 })
      })
    })

    verify(this, {
      column: 12,
      message: 'Expected to find element: h1, but never found it',
    })
  })
})

context('cy.spread', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.wrap([1, 2, 3]).spread(() => {
        expect(true).to.be.false
      })
    })

    verify(this, {
      column: 9,
      message: 'expected true to be false',
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
      message: '{}.bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.wrap([1, 2, 3]).spread(() => {
        cy.get('h1', { timeout: 1 })
      })
    })

    verify(this, {
      column: 12,
      message: 'Expected to find element: h1, but never found it',
    })
  })
})

context('cy.within', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.get('body').within(() => {
        expect(true).to.be.false
      })
    })

    verify(this, {
      column: 9,
      message: 'expected true to be false',
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
      message: '{}.bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.get('body').within(() => {
        cy.get('h1', { timeout: 1 })
      })
    })

    verify(this, {
      column: 12,
      message: 'Expected to find element: h1, but never found it',
    })
  })
})

context('cy.wrap', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.wrap(() => {
        expect(true).to.be.false
      }).then((fn) => fn())
    })

    verify(this, {
      column: 9,
      message: 'expected true to be false',
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
      message: '{}.bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.wrap(() => {
        cy.get('h1', { timeout: 1 })
      }).then((fn) => fn())
    })

    verify(this, {
      column: 12,
      message: 'Expected to find element: h1, but never found it',
    })
  })
})

context('cy.visit', () => {
  describe('onBeforeLoad assertion failure', function () {
    fail(this, () => {
      cy.visit('/index.html', {
        onBeforeLoad () {
          expect(true).to.be.false
        },
      })
    })

    verify(this, {
      column: 11,
      codeFrameText: 'onBeforeLoad',
      message: 'expected true to be false',
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
      message: '{}.bar is not a function',
    })
  })

  describe('onLoad assertion failure', function () {
    fail(this, () => {
      cy.visit('/index.html', {
        onLoad () {
          expect(true).to.be.false
        },
      })
    })

    verify(this, {
      column: 11,
      codeFrameText: 'onLoad',
      message: 'expected true to be false',
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
      message: '{}.bar is not a function',
    })
  })
})

context('cy.route', () => {
  describe('callback assertion failure', function () {
    fail(this, () => {
      cy.server().route(() => {
        expect(true).to.be.false
      })
    })

    verify(this, {
      column: 9,
      message: 'expected true to be false',
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
      message: '{}.bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.server().route(() => {
        cy.get('h1', { timeout: 1 })

        return '/foo'
      })
    })

    verify(this, {
      column: 12,
      message: 'Expected to find element: h1, but never found it',
    })
  })

  describe('onAbort assertion failure', function () {
    fail(this, () => {
      cy.server().route({
        url: '/foo',
        onAbort () {
          expect(true).to.be.false
        },
      })
      .window().then(abortXhr)
    })

    verify(this, {
      column: 11,
      codeFrameText: 'onAbort',
      message: 'expected true to be false',
    })
  })

  describe('onAbort exception', function () {
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
      message: '{}.bar is not a function',
    })
  })

  describe('onRequest assertion failure', function () {
    fail(this, () => {
      cy.server().route({
        url: '/foo',
        onRequest () {
          expect(true).to.be.false
        },
      })
      .window().then(sendXhr)
    })

    verify(this, {
      column: 11,
      codeFrameText: 'onRequest',
      message: 'expected true to be false',
    })
  })

  describe('onRequest exception', function () {
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
      message: '{}.bar is not a function',
    })
  })

  describe('onResponse assertion failure', function () {
    fail(this, () => {
      cy.server().route({
        url: '/users',
        onResponse () {
          expect(true).to.be.false
        },
      })
      .visit('/xhr.html').get('#fetch').click()
    })

    verify(this, {
      column: 11,
      codeFrameText: 'onResponse',
      message: 'expected true to be false',
    })
  })

  describe('onResponse exception', function () {
    fail(this, () => {
      cy.server().route({
        url: '/users',
        onResponse () {
          ({}).bar()
        },
      })
      .visit('/xhr.html').get('#fetch').click()
    })

    verify(this, {
      column: 16,
      codeFrameText: 'onResponse',
      message: '{}.bar is not a function',
    })
  })
})

context('cy.server', () => {
  describe('onAbort assertion failure', function () {
    fail(this, () => {
      cy.server({
        onAbort () {
          expect(true).to.be.false
        },
      })
      .route('/foo')
      .window().then(abortXhr)
    })

    verify(this, {
      column: 11,
      codeFrameText: 'onAbort',
      message: 'expected true to be false',
    })
  })

  describe('onAbort exception', function () {
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
      message: '{}.bar is not a function',
    })
  })

  describe('onRequest assertion failure', function () {
    fail(this, () => {
      cy.server({
        onRequest () {
          expect(true).to.be.false
        },
      })
      .route('/foo')
      .window().then(sendXhr)
    })

    verify(this, {
      column: 11,
      codeFrameText: 'onRequest',
      message: 'expected true to be false',
    })
  })

  describe('onRequest exception', function () {
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
      message: '{}.bar is not a function',
    })
  })

  describe('onResponse assertion failure', function () {
    fail(this, () => {
      cy.server({
        onResponse () {
          expect(true).to.be.false
        },
      })
      .route('/users')
      .visit('/xhr.html').get('#fetch').click()
    })

    verify(this, {
      column: 11,
      codeFrameText: 'onResponse',
      message: 'expected true to be false',
    })
  })

  describe('onResponse exception', function () {
    fail(this, () => {
      cy.server({
        onResponse () {
          ({}).bar()
        },
      })
      .route('/users')
      .visit('/xhr.html').get('#fetch').click()
    })

    verify(this, {
      column: 16,
      codeFrameText: 'onResponse',
      message: '{}.bar is not a function',
    })
  })
})

context('event handlers', () => {
  describe('event assertion failure', function (done) {
    fail(this, () => {
      cy.on('window:load', () => {
        expect(true).to.be.false
      })

      cy.visit('http://localhost:1919')
    })

    verify(this, {
      column: 9,
      message: 'expected true to be false',
    })
  })

  describe('event exception', function (done) {
    fail(this, () => {
      cy.on('window:load', () => {
        ({}).bar()
      })

      cy.visit('http://localhost:1919')
    })

    verify(this, {
      column: 14,
      message: '{}.bar is not a function',
    })
  })
})
