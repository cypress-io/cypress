/**
 * This tests various failure scenarios where an error and code frame is displayed
 * It does this by having a test fail and then a subsequent test run that
 * tests the appearance of the command log
 * Because of this, the test order is important
 * There should be the same number of failing tests as there are passing
 * tests, because each failure has a verification test (e.g. 11 fail, 11 pass)
 */
import outsideError from '../../../todos/throws-error'

const fail = (ctx, test) => {
  it(`✗ FAIL - ${ctx.title}`, test)
}

const verify = (ctx, { column, codeFrameText, message, support = false, regex }) => {
  // test only the column number because the line number is brittle
  // since any changes to this file can affect it
  if (!regex) {
    regex = support ?
      new RegExp(`cypress\/support\/index\.js:\\d+:${column}`) :
      new RegExp(`cypress\/integration\/various_failures_spec\.js:\\d+:${column}`)
  }

  it(`✓ VERIFY`, () => {
    cy.wrap(Cypress.$(window.top.document.body))
    .find('.reporter')
    .contains(`FAIL - ${ctx.title}`)
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

      // most code frames will show `fail(this,()=>` as the 1st line but
      // for some it's cut off due to the test code being more lines,
      // so we prefer the `codeFrameText`
      cy.get('.test-err-code-frame pre span').should('include.text', codeFrameText || 'fail(this,()=>')
    })
  })
}

//
// Begin Test Cases
//

describe('assertion', function () {
  fail(this, () => {
    expect(true).to.be.false
    expect(false).to.be.false
  })

  verify(this, {
    column: 5,
    message: 'expected true to be false',
  })
})

describe('exception', function () {
  fail(this, () => {
    ({}).bar()
  })

  verify(this, {
    column: 10,
    message: 'bar is not a function',
  })
})

describe('exception in file outside project', function () {
  fail(this, () => {
    outsideError()
  })

  verify(this, {
    column: 9,
    message: 'An outside error',
    regex: /todos\/throws\-error\.js:5:9/,
    codeFrameText: `thrownewError('An outside error')`,
  })
})

describe('command', function () {
  fail(this, () => {
    cy.get('h1', { timeout: 1 })
  })

  verify(this, {
    column: 8,
    message: 'Timed out retrying: Expected to find element: h1, but never found it',
  })
})

describe('chained command', function () {
  fail(this, () => {
    cy.get('div').find('h1', { timeout: 1 })
  })

  verify(this, {
    column: 19,
    message: 'Timed out retrying: Expected to find element: h1, but never found it',
  })
})

describe('then assertion', function () {
  fail(this, () => {
    cy.wrap({}).then(() => {
      expect(true).to.be.false
      expect(false).to.be.false
    })
  })

  verify(this, {
    column: 7,
    message: 'expected true to be false',
  })
})

describe('should callback assertion', function () {
  fail(this, () => {
    cy.wrap({}).should(() => {
      expect(true).to.be.false
      expect(false).to.be.false
    })
  })

  verify(this, {
    column: 7,
    message: 'expected true to be false',
  })
})

describe('then exception', function () {
  fail(this, () => {
    cy.wrap({}).then(() => {
      ({}).bar()
    })
  })

  verify(this, {
    column: 12,
    message: 'bar is not a function',
  })
})

describe('should callback exception', function () {
  fail(this, () => {
    cy.wrap({}).should(() => {
      ({}).bar()
    })
  })

  verify(this, {
    column: 12,
    message: 'bar is not a function',
  })
})

describe('should assertion', function () {
  fail(this, () => {
    cy.wrap({})
    .should('have.property', 'foo')
  })

  verify(this, {
    column: 6,
    message: 'Timed out retrying: expected {} to have property \'foo\'',
  })
})

describe('after multiple shoulds', function () {
  fail(this, () => {
    cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
    .should('equal', 'bar')
  })

  verify(this, {
    column: 6,
    message: 'Timed out retrying: expected \'foo\' to equal \'bar\'',
  })
})

describe('after multiple should callbacks exception', function () {
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
    column: 12,
    codeFrameText: '({}).bar()',
    message: 'bar is not a function',
  })
})

describe('after multiple should callbacks assertion', function () {
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
    column: 7,
    codeFrameText: '.should(()=>',
    message: 'expected true to be false',
  })
})

describe('command after should success', function () {
  fail(this, () => {
    cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
    cy.get('h1', { timeout: 1 })
  })

  verify(this, {
    column: 8,
    message: 'Timed out retrying: Expected to find element: h1, but never found it',
  })
})

describe('custom command - assertion', function () {
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

describe('custom command - exception', function () {
  fail(this, () => {
    cy.failException()
  })

  verify(this, {
    column: 8,
    support: true,
    codeFrameText: 'add(\'failException\'',
    message: 'bar is not a function',
  })
})

describe('custom command - command', function () {
  fail(this, () => {
    cy.failCommand()
  })

  verify(this, {
    column: 6,
    support: true,
    codeFrameText: 'add(\'failCommand\'',
    message: 'Timed out retrying: Expected to find element: h1, but never found it',
  })
})

describe('custom command - chained command', function () {
  fail(this, () => {
    cy.failChainedCommand()
  })

  verify(this, {
    column: 17,
    support: true,
    codeFrameText: 'add(\'failChainedCommand\'',
    message: 'Timed out retrying: Expected to find element: h1, but never found it',
  })
})

describe('custom command - then assertion', function () {
  fail(this, () => {
    cy.failThenAssertion()
  })

  verify(this, {
    column: 5,
    support: true,
    codeFrameText: 'add(\'failThenAssertion\'',
    message: 'expected true to be false',
  })
})

describe('custom command - should callback assertion', function () {
  fail(this, () => {
    cy.failShouldCallbackAssertion()
  })

  verify(this, {
    column: 5,
    support: true,
    codeFrameText: 'add(\'failShouldCallbackAssertion\'',
    message: 'expected true to be false',
  })
})

describe('custom command - then exception', function () {
  fail(this, () => {
    cy.failThenException()
  })

  verify(this, {
    column: 10,
    support: true,
    codeFrameText: 'add(\'failThenException\'',
    message: 'bar is not a function',
  })
})

describe('custom command - should callback exception', function () {
  fail(this, () => {
    cy.failShouldCallbackException()
  })

  verify(this, {
    column: 10,
    support: true,
    codeFrameText: 'add(\'failShouldCallbackException\'',
    message: 'bar is not a function',
  })
})

describe('custom command - should assertion', function () {
  fail(this, () => {
    cy.failShouldAssertion()
  })

  verify(this, {
    column: 4,
    support: true,
    codeFrameText: 'add(\'failShouldAssertion\'',
    message: 'Timed out retrying: expected {} to have property \'foo\'',
  })
})

describe('custom command - after multiple shoulds', function () {
  fail(this, () => {
    cy.failAfterMultipleShoulds()
  })

  verify(this, {
    column: 4,
    support: true,
    codeFrameText: 'add(\'failAfterMultipleShoulds\'',
    message: 'Timed out retrying: expected \'foo\' to equal \'bar\'',
  })
})

describe('custom command - after multiple should callbacks exception', function () {
  fail(this, () => {
    cy.failAfterMultipleShouldCallbacksException()
  })

  verify(this, {
    column: 10,
    support: true,
    codeFrameText: '({}).bar()',
    message: 'bar is not a function',
  })
})

describe('custom command - after multiple should callbacks assertion', function () {
  fail(this, () => {
    cy.failAfterMultipleShouldCallbacksAssertion()
  })

  verify(this, {
    column: 5,
    support: true,
    codeFrameText: '.should(()=>',
    message: 'expected true to be false',
  })
})

describe('custom command - command failure after should success', function () {
  fail(this, () => {
    cy.failCommandAfterShouldSuccess()
  })

  verify(this, {
    column: 6,
    support: true,
    codeFrameText: 'add(\'failCommandAfterShouldSuccess\'',
    message: 'Timed out retrying: Expected to find element: h1, but never found it',
  })
})
