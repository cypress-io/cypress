describe('Reporter Header', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp()
    cy.contains('dom-content.spec').click()
    cy.waitForSpecToFinish()
  })

  context('Specs Shortcut', () => {
    it('selects the correct spec in the Specs List', () => {
      cy.get('body').type('f')

      cy.get('[data-selected-spec="true"]').should('contain', 'dom-content').should('have.length', '1')
      cy.get('[data-selected-spec="false"]').should('have.length', '27')
    })

    it('filters the list of specs when searching for specs', () => {
      cy.get('body').type('f')

      cy.findByTestId('specs-list-panel').within(() => {
        cy.get('input').as('searchInput').type('dom', { force: true })
      })

      cy.get('[data-cy="spec-file-item"]').should('have.length', 3)
      .should('contain', 'dom-content.spec')

      cy.get('@searchInput').clear()

      cy.get('[data-cy="spec-file-item"]').should('have.length', 3)

      cy.get('@searchInput').type('asdf', { force: true })

      cy.findByTestId('spec-file-item').should('have.length', 0)
    })
  })

  context('Testing Preferences', () => {
    it('clicking the down arrow will open a panel showing Testing Preferences', () => {
      cy.get('.testing-preferences-toggle').trigger('mouseover')
      cy.get('.cy-tooltip').should('have.text', 'Open Testing Preferences')

      cy.get('.testing-preferences').should('not.exist')
      cy.get('.testing-preferences-toggle').should('not.have.class', 'open').click()
      cy.get('.testing-preferences-toggle').should('have.class', 'open')
      cy.get('.testing-preferences').should('be.visible')
      cy.get('.testing-preferences-toggle').click()
      cy.get('.testing-preferences-toggle').should('not.have.class', 'open')
      cy.get('.testing-preferences').should('not.exist')
    })

    it('will show a toggle beside the auto-scrolling option', () => {
      const switchSelector = '[data-cy=auto-scroll-switch]'

      cy.get('.testing-preferences-toggle').click()
      cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'true')
      cy.get(switchSelector).click()
      cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'false')
    })
  })
})
