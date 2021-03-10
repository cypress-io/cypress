const helpers = require('../support/helpers')

const { createCypress } = helpers
const { runIsolatedCypress, snapshotMochaEvents } = createCypress({ config: { experimentalStudio: true, isTextTerminal: true } })

describe('studio mocha events', () => {
  it('only runs a single test by id', () => {
    runIsolatedCypress('cypress/fixtures/studio/basic_spec.js', {
      state: {
        studioTestId: 'r4',
      },
    }).then(() => {
      cy.get('.reporter').contains('test 2').should('exist')
      cy.get('.reporter').contains('test 1').should('not.exist')
      cy.get('.reporter').contains('test 3').should('not.exist')
    })
    .then(snapshotMochaEvents)
  })

  it('creates a new test when adding to a suite', () => {
    runIsolatedCypress('cypress/fixtures/studio/basic_spec.js', {
      state: {
        studioSuiteId: 'r2',
      },
    })
    .then(() => {
      cy.get('.reporter').contains('suite').should('exist')
      cy.get('.reporter').contains('New Test').should('exist')
    })
    .then(snapshotMochaEvents)
  })

  it('can add new test to root runnable', () => {
    runIsolatedCypress('cypress/fixtures/empty_spec.js', {
      state: {
        studioSuiteId: 'r1',
      },
    })
    .then(() => {
      cy.get('.reporter').contains('New Test').should('exist')
    })
    .then(snapshotMochaEvents)
  })

  describe('hooks', () => {
    it('runs before hooks and test body but not after hooks when extending test', () => {
      runIsolatedCypress('cypress/fixtures/studio/hooks_spec.js', {
        state: {
          studioTestId: 'r3',
        },
      })
      .then(() => {
        cy.get('.reporter').contains('suite').should('exist')
        cy.get('.reporter').contains('test').should('exist')
        cy.get('.reporter').contains('before all').should('exist')
        cy.get('.reporter').contains('before each').should('exist')
        cy.get('.reporter').contains('test body').should('exist')
        cy.get('.reporter').contains('studio commands').should('exist')
        cy.get('.reporter').contains('after each').should('not.exist')
        cy.get('.reporter').contains('after').should('not.exist')
      })
      .then(snapshotMochaEvents)
    })

    it('runs before hooks but not after hooks when adding to suite', () => {
      runIsolatedCypress('cypress/fixtures/studio/hooks_spec.js', {
        state: {
          studioSuiteId: 'r2',
        },
      })
      .then(() => {
        cy.get('.reporter').contains('suite').should('exist')
        cy.get('.reporter').contains('test').should('exist')
        cy.get('.reporter').contains('before all').should('exist')
        cy.get('.reporter').contains('before each').should('exist')
        cy.get('.reporter').contains('studio commands').should('exist')
        cy.get('.reporter').contains('test body').should('not.exist')
        cy.get('.reporter').contains('after each').should('not.exist')
        cy.get('.reporter').contains('after').should('not.exist')
      })
      .then(snapshotMochaEvents)
    })
  })

  describe('only test', () => {
    it('can be extended', () => {
      runIsolatedCypress('cypress/fixtures/studio/only_test_spec.js', {
        state: {
          studioTestId: 'r4',
        },
      })
      .then(() => {
        cy.get('.reporter').contains('suite').should('exist')
        cy.get('.reporter').contains('nested suite 1').should('exist')
        cy.get('.reporter').contains('test 2').should('exist')
      })
      .then(snapshotMochaEvents)
    })

    it('can be extended when there are multiple in the spec', () => {
      runIsolatedCypress('cypress/fixtures/studio/only_test_multiple_spec.js', {
        state: {
          studioTestId: 'r5',
        },
      })
      .then(() => {
        cy.get('.reporter').contains('suite').should('exist')
        cy.get('.reporter').contains('nested suite 1').should('exist')
        cy.get('.reporter').contains('test 2').should('exist')
        cy.get('.reporter').contains('test 1').should('not.exist')
      })
      .then(snapshotMochaEvents)
    })

    it('can extend a suite that contains an only spec', () => {
      runIsolatedCypress('cypress/fixtures/studio/only_test_spec.js', {
        state: {
          studioSuiteId: 'r3',
        },
      })
      .then(() => {
        cy.get('.reporter').contains('suite').should('exist')
        cy.get('.reporter').contains('nested suite 1').should('exist')
        cy.get('.reporter').contains('test 2').should('not.exist')
      })
      .then(snapshotMochaEvents)
    })
  })

  describe('only suite', () => {
    it('can be added to', () => {
      runIsolatedCypress('cypress/fixtures/studio/only_suite_spec.js', {
        state: {
          studioSuiteId: 'r3',
        },
      })
      .then(() => {
        cy.get('.reporter').contains('suite').should('exist')
        cy.get('.reporter').contains('nested suite 2').should('exist')
        cy.get('.reporter').contains('New Test').should('exist')
      })
      .then(snapshotMochaEvents)
    })

    it('can be added to when there are multiple in the spec', () => {
      runIsolatedCypress('cypress/fixtures/studio/only_suite_multiple_spec.js', {
        state: {
          studioSuiteId: 'r4',
        },
      })
      .then(() => {
        cy.get('.reporter').contains('suite').should('exist')
        cy.get('.reporter').contains('nested suite 3').should('exist')
        cy.get('.reporter').contains('New Test').should('exist')
      })
      .then(snapshotMochaEvents)
    })

    it('can extend a test within an only suite', () => {
      runIsolatedCypress('cypress/fixtures/studio/only_suite_spec.js', {
        state: {
          studioTestId: 'r7',
        },
      })
      .then(() => {
        cy.get('.reporter').contains('suite').should('exist')
        cy.get('.reporter').contains('nested suite 2').should('exist')
        cy.get('.reporter').contains('test 3').should('exist')
      })
      .then(snapshotMochaEvents)
    })

    it('can extend a test within an only suite when there are multiple in the spec', () => {
      runIsolatedCypress('cypress/fixtures/studio/only_suite_multiple_spec.js', {
        state: {
          studioTestId: 'r10',
        },
      })
      .then(() => {
        cy.get('.reporter').contains('suite').should('exist')
        cy.get('.reporter').contains('nested suite 3').should('exist')
        cy.get('.reporter').contains('test 5').should('exist')
      })
      .then(snapshotMochaEvents)
    })
  })
})
