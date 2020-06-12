/**
 * See comment at top of various_failures_spec_1.js for more info
 * This covers the same errors but inside custom commands
 */

import outsideError from '../../../todos/throws-error'
import { setup, fail, verify } from '../support/util'

setup({
  idePath: {
    relative: 'cypress/support/commands.js',
    absolute: /\/[^\/]+\/cypress\/support\/commands\.js/,
  },
  verifyStackLineIsSpecFile: false,
})

context('assertion failures', function () {
  describe('with expect().<foo>', function () {
    fail(this, () => {
      cy.failExpect()
    })

    verify(this, {
      column: 23,
      codeFrameText: 'add(\'failExpect\'',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('with assert()', function () {
    fail(this, () => {
      cy.failAssert()
    })

    verify(this, {
      column: '(3|10)', // different between chrome & firefox
      codeFrameText: 'add(\'failAssert\'',
      message: 'should be true',
    })
  })

  describe('with assert.<foo>()', function () {
    fail(this, () => {
      cy.failAssertMethod()
    })

    verify(this, {
      column: 10,
      codeFrameText: 'add(\'failAssertMethod\'',
      message: `expected 'actual' to equal 'expected'`,
    })
  })
})

context('exceptions', function () {
  describe('in commands file', function () {
    fail(this, () => {
      cy.failException()
    })

    verify(this, {
      column: 8,
      codeFrameText: 'add(\'failException\'',
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
      cy.failCommand()
    })

    verify(this, {
      column: 6,
      codeFrameText: 'add(\'failCommand\'',
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('chained failure', function () {
    fail(this, () => {
      cy.failChainedCommand()
    })

    verify(this, {
      column: 18,
      codeFrameText: 'add(\'failChainedCommand\'',
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.then', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.failThenAssertion()
    })

    verify(this, {
      column: 25,
      codeFrameText: 'add(\'failThenAssertion\'',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('exception', function () {
    fail(this, () => {
      cy.failThenException()
    })

    verify(this, {
      column: 10,
      codeFrameText: 'add(\'failThenException\'',
      message: 'bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.failThenCommandFailure()
    })

    verify(this, {
      column: 8,
      codeFrameText: 'add(\'failThenCommandFailure\'',
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.should', function () {
  describe('callback assertion failure', function () {
    fail(this, () => {
      cy.failShouldCallbackAssertion()
    })

    verify(this, {
      column: 25,
      codeFrameText: 'add(\'failShouldCallbackAssertion\'',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('callback exception', function () {
    fail(this, () => {
      cy.failShouldCallbackException()
    })

    verify(this, {
      column: 10,
      codeFrameText: 'add(\'failShouldCallbackException\'',
      message: 'bar is not a function',
    })
  })

  describe('assertion failure', function () {
    fail(this, () => {
      cy.failShouldAssertion()
    })

    verify(this, {
      column: 4,
      codeFrameText: 'add(\'failShouldAssertion\'',
      message: 'Timed out retrying: expected {} to have property \'foo\'',
    })
  })

  describe('after multiple', function () {
    fail(this, () => {
      cy.failAfterMultipleShoulds()
    })

    verify(this, {
      column: 4,
      codeFrameText: 'add(\'failAfterMultipleShoulds\'',
      message: 'Timed out retrying: expected \'foo\' to equal \'bar\'',
    })
  })

  describe('after multiple callbacks exception', function () {
    fail(this, () => {
      cy.failAfterMultipleShouldCallbacksException()
    })

    verify(this, {
      column: 10,
      codeFrameText: '({}).bar()',
      message: 'bar is not a function',
    })
  })

  describe('after multiple callbacks assertion failure', function () {
    fail(this, () => {
      cy.failAfterMultipleShouldCallbacksAssertion()
    })

    verify(this, {
      column: 25,
      codeFrameText: '.should(()=>',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('after callback success assertion failure', function () {
    fail(this, () => {
      cy.failAfterCallbackSuccessAssertion()
    })

    verify(this, {
      column: 4,
      codeFrameText: '.should(\'have.property\',\'foo\')',
      message: `expected {} to have property 'foo'`,
    })
  })

  describe('command failure after success', function () {
    fail(this, () => {
      cy.failCommandAfterShouldSuccess()
    })

    verify(this, {
      column: 6,
      codeFrameText: 'add(\'failCommandAfterShouldSuccess\'',
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.each', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.failEachAssertion()
    })

    verify(this, {
      column: 25,
      codeFrameText: 'add(\'failEachAssertion\'',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('exception', function () {
    fail(this, () => {
      cy.failEachException()
    })

    verify(this, {
      column: 10,
      codeFrameText: 'add(\'failEachException\'',
      message: 'bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.failEachCommandFailure()
    })

    verify(this, {
      column: 8,
      codeFrameText: 'add(\'failEachCommandFailure\'',
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })
})
