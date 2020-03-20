/**
 * See comment at top of various_failures_spec.js for more info
 * This covers the same errors but inside custom commands
 */

import outsideError from '../../../todos/throws-error'
import { setup, fail, verify } from '../support/util'

setup({ support: true })

describe('assertion failure', function () {
  fail(this, () => {
    cy.failAssertion()
  })

  verify(this, {
    column: 3,
    support: true,
    codeFrameText: 'add(\'failAssertion\'',
    message: 'expected true to be false',
  })
})

describe('exceptions', function () {
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
      message: 'Timed out retrying: Expected to find element: h1, but never found it',
    })
  })

  describe('chained failure', function () {
    fail(this, () => {
      cy.failChainedCommand()
    })

    verify(this, {
      column: 17,
      codeFrameText: 'add(\'failChainedCommand\'',
      message: 'Timed out retrying: Expected to find element: h1, but never found it',
    })
  })
})

describe('cy.then', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.failThenAssertion()
    })

    verify(this, {
      column: 5,
      codeFrameText: 'add(\'failThenAssertion\'',
      message: 'expected true to be false',
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
      message: 'Timed out retrying: Expected to find element: h1, but never found it',
    })
  })
})

describe('cy.should', function () {
  describe('callback assertion failure', function () {
    fail(this, () => {
      cy.failShouldCallbackAssertion()
    })

    verify(this, {
      column: 5,
      codeFrameText: 'add(\'failShouldCallbackAssertion\'',
      message: 'expected true to be false',
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
      column: 5,
      codeFrameText: '.should(()=>',
      message: 'expected true to be false',
    })
  })

  describe('command failure after success', function () {
    fail(this, () => {
      cy.failCommandAfterShouldSuccess()
    })

    verify(this, {
      column: 6,
      codeFrameText: 'add(\'failCommandAfterShouldSuccess\'',
      message: 'Timed out retrying: Expected to find element: h1, but never found it',
    })
  })
})
