/* eslint-disable @cypress/dev/skip-comment */

// Validating Mocha syntax and behavior of *.skip is still valid after being patched by `zone.js/testing`
// Github Issue: https://github.com/cypress-io/cypress/issues/23409
describe('skip', () => {
  context('01 - executions', () => {
    describe('suite', () => {
      suite.skip('should exist on "suite"', () => {
        it('skipped', () => {})
      })
    })

    describe('describe', () => {
      describe.skip('should exist on "describe"', () => {
        it('skipped', () => {})
      })
    })

    describe('context', () => {
      context.skip('should exist on "context"', () => {
        it('skipped', () => {})
      })
    })

    describe('specify', () => {
      specify.skip('should exist on "specify"', () => {})
    })

    describe('test', () => {
      test.skip('should exist on "test"', () => {})
    })

    describe('it', () => {
      it.skip('should exist on "it"', () => {})
    })
  })

  context('02 - validations', () => {
    const verifyWasSkipped = (title: string) => {
      cy.wrap(Cypress.$(window.top!.document.body)).within(() => {
        return cy
        .contains(title)
        .parents('[data-model-state="pending"]') // Find parent row with class indicating test was skipped
        // the size of the reporter might be smaller, resulting in autoscroll in headless,
        // meaning some of these will not be visible, hence checking for existence
        .should('exist')
      })
    }

    describe('suite', () => {
      it('should have been skipped', () => {
        verifyWasSkipped('should exist on "suite"')
      })
    })

    describe('describe', () => {
      it('should have been skipped', () => {
        verifyWasSkipped('should exist on "describe"')
      })
    })

    describe('context', () => {
      it('should have been skipped', () => {
        verifyWasSkipped('should exist on "context"')
      })
    })

    describe('specify', () => {
      it('should have been skipped', () => {
        verifyWasSkipped('should exist on "specify"')
      })
    })

    describe('test', () => {
      it('should have been skipped', () => {
        verifyWasSkipped('should exist on "test"')
      })
    })

    describe('it', () => {
      it('should have been skipped', () => {
        verifyWasSkipped('should exist on "it"')
      })
    })
  })
})

it('empty passing test', () => {})
