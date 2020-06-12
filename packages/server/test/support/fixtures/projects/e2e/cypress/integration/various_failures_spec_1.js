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
  setup,
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
