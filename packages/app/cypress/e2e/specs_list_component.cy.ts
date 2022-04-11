describe('App: Spec List (Component)', () => {
  beforeEach(() => {
    cy.scaffoldProject('component-tests')
    cy.openProject('component-tests')
    cy.startAppServer('component')
    cy.visitApp()
  })

  it('opens spec pattern modal', () => {
    cy.contains('button', 'View spec pattern').click()

    cy.get('[data-cy="spec-pattern-modal"]').should('be.visible')
    cy.get('[data-cy="spec-pattern"]').contains('cypress/component-tests/**/*')

    cy.contains('button', 'Update Spec Pattern').click()
    cy.get('[data-cy="choose-editor-modal"]').should('be.visible').within(() => {
      cy.get('[aria-label="Close"]').click()
    })

    cy.contains('button', 'Dismiss').click()
    cy.get('[data-cy="spec-pattern-modal"]').should('not.exist')
  })

  it('highlights the currently running spec', () => {
    cy.contains('fails').click()

    cy.get('[data-selected-spec="true"]').should('contain', 'fails')
    cy.get('[data-selected-spec="false"]').should('contain', 'foo')
  })

  it('opens the "Create a new spec" modal after clicking the "New Specs" button', () => {
    cy.get('[data-cy="standard-modal"]').should('not.exist')
    cy.get('[data-cy="new-spec-button"]').click()
    cy.get('[data-cy="standard-modal"]').get('h2').contains('Create a new spec')
    cy.get('button').contains('Create from component').should('be.visible')
    cy.get('button').get('[aria-label="Close"]').click()
    cy.get('[data-cy="standard-modal"]').should('not.exist')
  })
})
