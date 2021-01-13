const helpers = require('../support/helpers')

const { createCypress } = helpers
const { runIsolatedCypress } = createCypress()

describe('runner/cypress header.spec.js', () => {
  context('selector playground', () => {
    it('shows tooltip on hover', () => {
      runIsolatedCypress({})
      cy.get('.selector-playground-toggle').trigger('mouseover')
      cy.get('.cy-tooltip').should('be.visible')
      .and('contain', 'Open Selector Playground')
    })

    it('toggles on click', () => {
      runIsolatedCypress({})
      cy.get('.selector-playground').should('not.be.visible')
      cy.get('.selector-playground-toggle').click()
      cy.get('.selector-playground').should('be.visible')
      cy.get('.selector-playground-toggle').click()
      cy.get('.selector-playground').should('not.be.visible')
    })

    describe('when open', () => {
      it('window dimensions are updated', () => {
        runIsolatedCypress({})
        cy.get('.iframes-container').should('have.css', 'top', '46px')
        cy.get('.selector-playground-toggle').click()
        cy.get('.iframes-container').should('have.css', 'top', '92px')
        cy.get('.selector-playground').should('be.visible')

        cy.percySnapshot()
      })

      it('tooltip does not show', () => {
        runIsolatedCypress({})
        cy.get('.selector-playground-toggle').click()
        cy.get('.selector-playground-toggle').trigger('mouseover')
        cy.get('.cy-tooltip').should('not.exist')
      })
    })
  })

  context('url', () => {
    it('displays', () => {
      runIsolatedCypress(() => {
        it('foo', () => {
          cy.visit('/')
        })
      })

      cy.get('.url').should('have.value', 'http://localhost:3500/fixtures/dom.html')
    })
  })

  context('viewport dropdown', () => {
    it('displays width, height, and display scale', () => {
      runIsolatedCypress({})

      cy.get('.viewport-info')
      .contains('1000 x 660 (55%)')
    })

    it('shows on click', () => {
      runIsolatedCypress({})
      cy.get('.viewport-menu').should('not.be.visible')
      cy.get('.viewport-info button').click()
      cy.get('.viewport-menu').should('be.visible')

      cy.percySnapshot()
    })

    it('displays default width and height in menu', () => {
      runIsolatedCypress({})
      cy.get('.viewport-info button').click()
      cy.get('.viewport-menu').contains('"viewportWidth": 1000')
      cy.get('.viewport-menu').contains('"viewportHeight": 660')
    })
  })
})
