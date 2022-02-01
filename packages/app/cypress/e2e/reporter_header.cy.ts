describe('Reporter Header', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp()
    cy.contains('dom-content.spec').click()
  })

  context('Specs Shortcut', () => {
    it('displays the currently running spec as highlighted in the Specs List', () => {
      cy.location().should((location) => {
        expect(location.hash).to.contain('dom-content.spec')
      })

      cy.get('[data-selected-spec="true"').should('contain', 'dom-content')
      cy.get('[data-selected-spec="false"').should('have.length', '1')
    })

    it('will display the extension in the list as a different highlighted color than the filename', () => {
      cy.location().should((location) => {
        expect(location.hash).to.contain('dom-content.spec')
      })

      cy.get('[data-testid=spec-file-item]').get('.text-gray-700')
      .should('contain', '.')
      .should('contain', 's')
      .should('contain', 'p')
      .should('contain', 'e')
      .should('contain', 'c')
      .should('contain', '.')
      .should('contain', 'j')
      .should('contain', 's')
    })

    it('filters the list of specs when searching for specs', () => {
      cy.location().should((location) => {
        expect(location.hash).to.contain('dom-content.spec')
      })

      cy.get('input').type('dom', { force: true })

      cy.get('[data-testid="spec-file-item"]').should('have.length', 1)
      .should('contain', 'dom-content.spec')

      cy.get('input').clear().type('asdf', { force: true })

      cy.get('[data-testid="spec-file-item"]').should('have.length', 0)
    })
  })

  context('Testing Preferences', () => {
    it('clicking the down arrow will open a panel showing Testing Preferences', () => {
      cy.location().should((location) => {
        expect(location.hash).to.contain('dom-content.spec')
      })

      cy.get('.testing-preferences-toggle').trigger('mouseover')
      cy.get('.cy-tooltip').should('have.text', 'Open Testing Preferences')

      cy.get('.testing-preferences').should('not.exist')
      cy.get('.testing-preferences-toggle').should('not.have.class', 'open')
      cy.get('.testing-preferences-toggle').click()
      cy.get('.testing-preferences-toggle').should('have.class', 'open')
      cy.get('.testing-preferences').should('be.visible')
      cy.get('.testing-preferences-toggle').click()
      cy.get('.testing-preferences-toggle').should('not.have.class', 'open')
      cy.get('.testing-preferences').should('not.exist')
    })

    it('will show a toggle beside the auto-scrolling option', () => {
      cy.location().should((location) => {
        expect(location.hash).to.contain('dom-content.spec')
      })

      const switchSelector = '[data-cy=auto-scroll-switch]'

      cy.get('.testing-preferences-toggle').click()
      cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'true')
      cy.get(switchSelector).click()
      cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'false')
    })
  })
})
