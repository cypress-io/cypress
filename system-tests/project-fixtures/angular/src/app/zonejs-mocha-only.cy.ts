/* eslint-disable mocha/no-exclusive-tests */
const ExcludedTestTitle = 'should not exist'

// Validating Mocha syntax and behavior of *.only is still valid after being patched by `zone.js/testing`
// Github Issue: https://github.com/cypress-io/cypress/issues/23409
describe('only', () => {
  context.only('01 - executions', () => {
    describe('suite', () => {
      suite.only('should exist on "suite"', () => {
        it('succeeds', () => {})
      })

      it(ExcludedTestTitle, () => {})
    })

    describe('describe', () => {
      describe.only('should exist on "describe"', () => {
        it('succeeds', () => {})
      })

      it(ExcludedTestTitle, () => {})
    })

    describe('context', () => {
      context.only('should exist on "context"', () => {
        it('succeeds', () => {})
      })

      it(ExcludedTestTitle, () => {})
    })

    describe('specify', () => {
      specify.only('should exist on "specify"', () => {})
      it(ExcludedTestTitle, () => {})
    })

    describe('test', () => {
      test.only('should exist on "test"', () => {})
      it(ExcludedTestTitle, () => {})
    })

    describe('it', () => {
      it.only('should exist on "it"', () => {})
      it(ExcludedTestTitle, () => {})
    })
  })

  context.only('02 - validations', () => {
    const verifyNotPresent = (title: string) => {
      cy.wrap(Cypress.$(window.top!.document.body)).within(() => {
        return cy
        .contains(title)
        .should('not.exist')
      })
    }

    describe('suite', () => {
      it('should not include other test', () => {
        verifyNotPresent(ExcludedTestTitle)
      })
    })

    describe('describe', () => {
      it('should not include other test', () => {
        verifyNotPresent(ExcludedTestTitle)
      })
    })

    describe('context', () => {
      it('should not include other test', () => {
        verifyNotPresent(ExcludedTestTitle)
      })
    })

    describe('specify', () => {
      it('should not include other test', () => {
        verifyNotPresent(ExcludedTestTitle)
      })
    })

    describe('test', () => {
      it('should not include other test', () => {
        verifyNotPresent(ExcludedTestTitle)
      })
    })

    describe('it', () => {
      it('should not include other test', () => {
        verifyNotPresent(ExcludedTestTitle)
      })
    })
  })
})

it('empty passing test', () => {})
