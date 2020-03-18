/**
 * This tests various failure scenarios where a an error and code frame is displayed
 * It does this by having a test fail and then a subsequent test run that
 * tests the appearance of the command log
 * Because of this, the test order is important
 * There should be the same number of failing tests as there are passing
 * tests, because each failure has a verification test (e.g. 11 fail, 11 pass)
 * Each test is nested inside a `describe` because otherwise the subsequent
 * test will not be run
 */
import outsideError from '../../../todos/throws-error'

describe('various failures', () => {
  let counter = 0

  const failure = (testName, test) => {
    describe(`f-${++counter}`, () => {
      it(`✗ SHOULD FAIL - ${testName}`, test)
    })
  }

  const verify = (testName, { column, codeFrameText, message, support = false, regex }) => {
    // test only the column number because the line number is brittle
    // since any changes to this file can affect it
    if (!regex) {
      regex = support ?
        new RegExp(`cypress\/support\/index\.js:\\d+:${column}`) :
        new RegExp(`cypress\/integration\/various_failures_spec\.js:\\d+:${column}`)
    }

    describe(`v-${counter}`, () => {
      it(`✓ SHOULD PASS - ${testName}`, () => {
        cy.wrap(Cypress.$(window.top.document.body))
        .find('.reporter')
        .contains(`SHOULD FAIL - ${testName}`)
        .closest('.runnable-wrapper')
        .within(() => {
          cy.get('.runnable-err-message')
          .should('include.text', message)

          cy.get('.runnable-err-stack-trace')
          .invoke('text')
          .should('match', regex)

          cy
          .get('.test-err-code-frame .runnable-err-file-path')
          .invoke('text')
          .should('match', regex)

          // most code frames will have the `testName` in them but for some
          // it's cut off due to the code frame only showing 2 lines before
          // and after the highlighted, so we prefer the `codeFrameText`
          cy.get('.test-err-code-frame pre span').should('include.text', codeFrameText || testName)
        })
      })
    })
  }

  failure('assertion', () => {
    expect(true).to.be.false
    expect(false).to.be.false
  })

  verify('assertion', {
    column: 5,
    message: 'expected true to be false',
  })

  // -----

  failure('exception', () => {
    ({}).bar()
  })

  verify('exception', {
    column: 10,
    message: 'bar is not a function',
  })

  // -----

  failure('exception in file outside project', () => {
    outsideError()
  })

  verify('exception in file outside project', {
    column: 9,
    message: 'An outside error',
    regex: /todos\/throws\-error\.js:5:9/,
    codeFrameText: `thrownewError('An outside error')`,
  })

  // -----

  failure('command', () => {
    cy.get('h1', { timeout: 1 })
  })

  verify('command', {
    column: 8,
    message: 'Timed out retrying: Expected to find element: h1, but never found it',
  })

  // -----

  failure('chained command', () => {
    cy.get('div').find('h1', { timeout: 1 })
  })

  verify('chained command', {
    column: 19,
    message: 'Timed out retrying: Expected to find element: h1, but never found it',
  })

  // -----

  failure('then assertion', () => {
    cy.wrap({}).then(() => {
      expect(true).to.be.false
      expect(false).to.be.false
    })
  })

  verify('then assertion', {
    column: 7,
    message: 'expected true to be false',
  })

  // -----

  failure('should callback assertion', () => {
    cy.wrap({}).should(() => {
      expect(true).to.be.false
      expect(false).to.be.false
    })
  })

  verify('should callback assertion', {
    column: 7,
    message: 'expected true to be false',
  })

  // -----

  failure('then exception', () => {
    cy.wrap({}).then(() => {
      ({}).bar()
    })
  })

  verify('then exception', {
    column: 12,
    message: 'bar is not a function',
  })

  // -----

  failure('should callback exception', () => {
    cy.wrap({}).should(() => {
      ({}).bar()
    })
  })

  verify('should callback exception', {
    column: 12,
    message: 'bar is not a function',
  })

  // -----

  failure('should assertion', () => {
    cy.wrap({})
    .should('have.property', 'foo')
  })

  verify('should assertion', {
    column: 6,
    message: 'Timed out retrying: expected {} to have property \'foo\'',
  })

  // -----

  failure('after multiple shoulds', () => {
    cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
    .should('equal', 'bar')
  })

  verify('after multiple shoulds', {
    column: 6,
    message: 'Timed out retrying: expected \'foo\' to equal \'bar\'',
  })

  // -----

  failure('after multiple should callbacks exception', () => {
    cy.wrap({ foo: 'foo' })
    .should(() => {
      expect(true).to.be.true
    })
    .should(() => {
      ({}).bar()
    })
  })

  verify('after multiple should callbacks exception', {
    column: 12,
    codeFrameText: '({}).bar()',
    message: 'bar is not a function',
  })

  // -----

  failure('after multiple should callbacks assertion', () => {
    cy.wrap({ foo: 'foo' })
    .should(() => {
      expect(true).to.be.true
    })
    .should(() => {
      expect(true).to.be.false
    })
  })

  verify('after multiple should callbacks assertion', {
    column: 7,
    codeFrameText: '.should(()=>',
    message: 'expected true to be false',
  })

  // -----

  failure('command after should success', () => {
    cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
    cy.get('h1', { timeout: 1 })
  })

  verify('command after should success', {
    column: 8,
    message: 'Timed out retrying: Expected to find element: h1, but never found it',
  })

  // -----

  failure('custom command - assertion', () => {
    cy.failAssertion()
  })

  verify('custom command - assertion', {
    column: 3,
    support: true,
    codeFrameText: 'add(\'failAssertion\'',
    message: 'expected true to be false',
  })

  // -----

  failure('custom command - exception', () => {
    cy.failException()
  })

  verify('custom command - exception', {
    column: 8,
    support: true,
    codeFrameText: 'add(\'failException\'',
    message: 'bar is not a function',
  })

  // -----

  failure('custom command - command', () => {
    cy.failCommand()
  })

  verify('custom command - command', {
    column: 6,
    support: true,
    codeFrameText: 'add(\'failCommand\'',
    message: 'Timed out retrying: Expected to find element: h1, but never found it',
  })

  // -----

  failure('custom command - chained command', () => {
    cy.failChainedCommand()
  })

  verify('custom command - chained command', {
    column: 17,
    support: true,
    codeFrameText: 'add(\'failChainedCommand\'',
    message: 'Timed out retrying: Expected to find element: h1, but never found it',
  })

  // -----

  failure('custom command - then assertion', () => {
    cy.failThenAssertion()
  })

  verify('custom command - then assertion', {
    column: 5,
    support: true,
    codeFrameText: 'add(\'failThenAssertion\'',
    message: 'expected true to be false',
  })

  // -----

  failure('custom command - should callback assertion', () => {
    cy.failShouldCallbackAssertion()
  })

  verify('custom command - should callback assertion', {
    column: 5,
    support: true,
    codeFrameText: 'add(\'failShouldCallbackAssertion\'',
    message: 'expected true to be false',
  })

  // -----

  failure('custom command - then exception', () => {
    cy.failThenException()
  })

  verify('custom command - then exception', {
    column: 10,
    support: true,
    codeFrameText: 'add(\'failThenException\'',
    message: 'bar is not a function',
  })

  // -----

  failure('custom command - should callback exception', () => {
    cy.failShouldCallbackException()
  })

  verify('custom command - should callback exception', {
    column: 10,
    support: true,
    codeFrameText: 'add(\'failShouldCallbackException\'',
    message: 'bar is not a function',
  })

  // -----

  failure('custom command - should assertion', () => {
    cy.failShouldAssertion()
  })

  verify('custom command - should assertion', {
    column: 4,
    support: true,
    codeFrameText: 'add(\'failShouldAssertion\'',
    message: 'Timed out retrying: expected {} to have property \'foo\'',
  })

  // -----

  failure('custom command - after multiple shoulds', () => {
    cy.failAfterMultipleShoulds()
  })

  verify('custom command - after multiple shoulds', {
    column: 4,
    support: true,
    codeFrameText: 'add(\'failAfterMultipleShoulds\'',
    message: 'Timed out retrying: expected \'foo\' to equal \'bar\'',
  })

  // -----

  failure('custom command - after multiple should callbacks exception', () => {
    cy.failAfterMultipleShouldCallbacksException()
  })

  verify('custom command - after multiple should callbacks exception', {
    column: 10,
    support: true,
    codeFrameText: '({}).bar()',
    message: 'bar is not a function',
  })

  // -----

  failure('custom command - after multiple should callbacks assertion', () => {
    cy.failAfterMultipleShouldCallbacksAssertion()
  })

  verify('custom command - after multiple should callbacks assertion', {
    column: 5,
    support: true,
    codeFrameText: '.should(()=>',
    message: 'expected true to be false',
  })

  // -----

  failure('custom command - command failure after should success', () => {
    cy.failCommandAfterShouldSuccess()
  })

  verify('custom command - command failure after should success', {
    column: 6,
    support: true,
    codeFrameText: 'add(\'failCommandAfterShouldSuccess\'',
    message: 'Timed out retrying: Expected to find element: h1, but never found it',
  })
})
