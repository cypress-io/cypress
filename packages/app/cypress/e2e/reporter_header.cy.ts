describe('Reporter Header', () => {
  context('Specs Shortcut', () => {
    beforeEach(() => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.openProject('cypress-in-cypress')
      cy.startAppServer()
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('dom-content.spec').click()
      cy.waitForSpecToFinish()
    })

    it('selects the correct spec in the Specs List', () => {
      cy.get('body').type('f')

      cy.get('[data-selected-spec="true"]').should('contain', 'dom-content').should('have.length', '1')
      cy.get('[data-selected-spec="false"]').should('have.length', '32')
    })

    // TODO: Reenable as part of https://github.com/cypress-io/cypress/issues/23902
    it.skip('filters the list of specs when searching for specs', () => {
      cy.get('body').type('f')

      cy.findByTestId('specs-list-panel').within(() => {
        cy.get('input').as('searchInput').type('dom', { force: true })
      })

      cy.get('[data-cy="spec-file-item"]').should('have.length', 3)
      .should('contain', 'dom-content.spec')

      cy.get('@searchInput').clear()

      cy.get('[data-cy="spec-file-item"]').should('have.length', 23)

      cy.get('@searchInput').type('asdf', { force: true })

      cy.findByTestId('spec-file-item').should('have.length', 0)
    })
  })

  context('Testing Preferences', () => {
    const switchSelector = '[data-cy=auto-scroll-switch]'

    context('preferences menu', () => {
      beforeEach(() => {
        cy.scaffoldProject('cypress-in-cypress')
        cy.openProject('cypress-in-cypress')
        cy.startAppServer()
        cy.visitApp()
        cy.specsPageIsVisible()
        cy.contains('dom-content.spec').click()
        cy.waitForSpecToFinish()
      })

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
        cy.get('.testing-preferences-toggle').click()
        cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'true')
        cy.get(switchSelector).click()
        cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'false')
      })
    })

    it('does NOT toggle off the user preferences auto-scroll if auto-scroll is temporarily disabled', () => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.openProject('cypress-in-cypress')
      cy.startAppServer()
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('dom-content-scrollable-commands.spec').click()

      // wait for the test to scroll all the way to the bottom
      cy.get(':contains("checks for list items to exist - iteration #25") + :contains("passed")', {
        timeout: 20000,
      }).should('exist')

      // then, use the runnable container to fire the scroll events that previously would override and sync the preference config
      cy.get('[data-cy="reporter-panel"] .reporter > header + .container').its('0').then(($runnableContainer) => {
        // scroll the container to the top.
        // fire multiple scroll events so our scroller component believes the scroll came from an actual user.
        [...Array(10).keys()].forEach(() => {
          $runnableContainer.dispatchEvent(new CustomEvent('scroll'))
        })
      })

      cy.get('.testing-preferences-toggle').click()
      cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'true')
    })
  })
})
