const helpers = require('../support/helpers')

const { createCypress } = helpers
const { runIsolatedCypress } = createCypress({ config: { experimentalStudio: true } })

describe('studio ui', () => {
  it('launches studio ui when extending test', () => {
    runIsolatedCypress('cypress/fixtures/studio/basic_spec.js', {
      state: {
        studioTestId: 'r3',
      },
    })
    .then(() => {
      cy.get('.reporter').should('have.class', 'studio-active')
      cy.get('.reporter').contains('studio commands').should('exist')
      cy.get('.reporter').contains('test 1').should('exist')

      cy.get('.runner').find('header').should('have.class', 'showing-studio')
      cy.get('.runner').find('.studio-controls').find('.button-studio-close').should('exist')
      cy.get('.runner').find('.studio-controls').find('.button-studio-restart').should('exist')
      cy.get('.runner').find('.studio-controls').find('.button-studio-save').should('exist')

      cy.percySnapshot()
    })
  })

  it('prompts for url when there is no url', () => {
    runIsolatedCypress('cypress/fixtures/studio/basic_spec.js', {
      config: {
        baseUrl: null,
      },
      state: {
        studioTestId: 'r5',
      },
    })
    .then(() => {
      cy.get('.runner').find('.menu-cover').should('have.class', 'menu-cover-display')
      cy.get('.runner').find('.menu-cover').should('be.visible')

      cy.get('.runner').find('.url-container').should('have.class', 'menu-open')
      cy.get('.runner').find('.url').should('have.class', 'input-active')
      cy.get('.runner').find('.url').should('have.value', '')

      cy.get('.runner').find('.url-menu').should('be.visible')

      cy.percySnapshot()
    })
  })

  it('prefixes url prompt with baseUrl', () => {
    runIsolatedCypress('cypress/fixtures/studio/basic_spec.js', {
      config: {
        baseUrl: 'the://url',
      },
      state: {
        studioTestId: 'r5',
      },
    })
    .then(() => {
      cy.get('.runner').find('.url-container').should('have.class', 'menu-open')
      cy.get('.runner').find('.url').should('have.class', 'input-active')
      cy.get('.runner').find('.url').should('have.value', 'the://url/')
    })
  })

  it('displays modal when available commands is clicked', () => {
    runIsolatedCypress('cypress/fixtures/studio/basic_spec.js', {
      state: {
        studioTestId: 'r3',
      },
    })
    .then(() => {
      cy.get('.runner').contains('Available Commands').click()
      cy.get('reach-portal').should('exist')
      cy.get('reach-portal').find('.cancel').click()
      cy.get('reach-portal').should('not.exist')
    })
  })
})
