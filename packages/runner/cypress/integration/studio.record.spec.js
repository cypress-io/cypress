const helpers = require('../support/helpers')

const { createCypress } = helpers
const { runIsolatedCypress } = createCypress({ config: { experimentalStudio: true } })

const runCypressStudio = () => {
  return runIsolatedCypress('cypress/fixtures/studio/basic_spec.js', {
    config: {
      env: {
        INTERNAL_E2E_TESTS: 1,
      },
    },
    state: {
      studioTestId: 'r3',
    },
    visitUrl: 'http://localhost:3500/fixtures/studio.html',
  })
}

const getFrame = () => {
  return cy.get('.aut-iframe').its('0.contentDocument').its('body').should('not.be.undefined').then(cy.wrap)
}

const getParentCommand = (index) => {
  return cy.get('.reporter').find('.hook-studio').find('.command-number').contains(index).closest('.command')
}

const getChildCommand = (index) => {
  return getParentCommand(index).next('.command')
}

const verifyCommandLog = (index, { selector, name, message }) => {
  getParentCommand(index).find('.command-message').should('have.text', selector)

  getChildCommand(index).find('.command-method').should('have.text', name)

  if (message) {
    getChildCommand(index).find('.command-message').should('have.text', message)
  }
}

describe('studio record', () => {
  it('records click event', () => {
    runCypressStudio()
    .then(() => {
      getFrame().find('.btn').click({ force: true })

      verifyCommandLog(1, {
        selector: '.btn',
        name: 'click',
      })
    })
  })
})
