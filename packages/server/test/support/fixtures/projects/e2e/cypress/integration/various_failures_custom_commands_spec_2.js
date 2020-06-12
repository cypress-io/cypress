/**
 * See comment at top of various_failures_spec_1.js for more info
 * This covers the same errors but inside custom commands
 */

import { setup, fail, verify } from '../support/util'

setup({
  idePath: {
    relative: 'cypress/support/commands.js',
    absolute: /\/[^\/]+\/cypress\/support\/commands\.js/,
  },
  verifyStackLineIsSpecFile: false,
})

context('cy.spread', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.failSpreadAssertion()
    })

    verify(this, {
      column: 25,
      codeFrameText: 'add(\'failSpreadAssertion\'',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('exception', function () {
    fail(this, () => {
      cy.failSpreadException()
    })

    verify(this, {
      column: 10,
      codeFrameText: 'add(\'failSpreadException\'',
      message: 'bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.failSpreadCommandFailure()
    })

    verify(this, {
      column: 8,
      codeFrameText: 'add(\'failSpreadCommandFailure\'',
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.within', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.failWithinAssertion()
    })

    verify(this, {
      column: 25,
      codeFrameText: 'add(\'failWithinAssertion\'',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('exception', function () {
    fail(this, () => {
      cy.failWithinException()
    })

    verify(this, {
      column: 10,
      codeFrameText: 'add(\'failWithinException\'',
      message: 'bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.failWithinCommandFailure()
    })

    verify(this, {
      column: 8,
      codeFrameText: 'add(\'failWithinCommandFailure\'',
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.wrap', function () {
  describe('assertion failure', function () {
    fail(this, () => {
      cy.failWrapAssertion()
    })

    verify(this, {
      column: 25,
      codeFrameText: 'add(\'failWrapAssertion\'',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('exception', function () {
    fail(this, () => {
      cy.failWrapException()
    })

    verify(this, {
      column: 10,
      codeFrameText: 'add(\'failWrapException\'',
      message: 'bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.failWrapCommandFailure()
    })

    verify(this, {
      column: 8,
      codeFrameText: 'add(\'failWrapCommandFailure\'',
      message: 'Timed out retrying: Expected to find element: #does-not-exist, but never found it',
    })
  })
})

context('cy.visit', function () {
  describe('onBeforeLoad assertion failure', function () {
    fail(this, () => {
      cy.failVisitBeforeLoadAssertion()
    })

    verify(this, {
      column: 27,
      codeFrameText: 'onBeforeLoad',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onBeforeLoad exception', function () {
    fail(this, () => {
      cy.failVisitBeforeLoadException()
    })

    verify(this, {
      column: 12,
      codeFrameText: 'onBeforeLoad',
      message: 'bar is not a function',
    })
  })

  describe('onLoad assertion failure', function () {
    fail(this, () => {
      cy.failVisitLoadAssertion()
    })

    verify(this, {
      column: 27,
      codeFrameText: 'onLoad',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onLoad exception', function () {
    fail(this, () => {
      cy.failVisitLoadException()
    })

    verify(this, {
      column: 12,
      codeFrameText: 'onLoad',
      message: 'bar is not a function',
    })
  })
})

context('cy.route', function () {
  describe('callback assertion failure', function () {
    fail(this, () => {
      cy.failRouteCallbackAssertion()
    })

    verify(this, {
      column: 25,
      codeFrameText: 'failRouteCallbackAssertion',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('callback exception', function () {
    fail(this, () => {
      cy.failRouteCallbackException()
    })

    verify(this, {
      column: 10,
      codeFrameText: 'failRouteCallbackException',
      message: 'bar is not a function',
    })
  })

  describe('command failure', function () {
    fail(this, () => {
      cy.failRouteCallbackCommandFailure()
    })

    verify(this, {
      column: 8,
      codeFrameText: 'failRouteCallbackCommandFailure',
      message: 'Expected to find element: #does-not-exist, but never found it',
    })
  })

  describe('onAbort assertion failure', function (done) {
    fail(this, () => {
      cy.failRouteOnAbortAssertion()
    })

    verify(this, {
      column: 27,
      codeFrameText: 'onAbort',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onAbort exception', function (done) {
    fail(this, () => {
      cy.failRouteOnAbortException()
    })

    verify(this, {
      column: 12,
      codeFrameText: 'onAbort',
      message: 'bar is not a function',
    })
  })

  describe('onRequest assertion failure', function (done) {
    fail(this, () => {
      cy.failRouteOnRequestAssertion()
    })

    verify(this, {
      column: 27,
      codeFrameText: 'onRequest',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onRequest exception', function (done) {
    fail(this, () => {
      cy.failRouteOnRequestException()
    })

    verify(this, {
      column: 12,
      codeFrameText: 'onRequest',
      message: 'bar is not a function',
    })
  })

  describe('onResponse assertion failure', function (done) {
    fail(this, () => {
      cy.failRouteOnResponseAssertion()
    })

    verify(this, {
      column: 27,
      codeFrameText: 'onResponse',
      message: `expected 'actual' to equal 'expected'`,
    })
  })

  describe('onResponse exception', function (done) {
    fail(this, () => {
      cy.failRouteOnResponseException()
    })

    verify(this, {
      column: 12,
      codeFrameText: 'onResponse',
      message: 'bar is not a function',
    })
  })
})
