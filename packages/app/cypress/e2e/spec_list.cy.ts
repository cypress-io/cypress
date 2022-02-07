describe('App: Spec List', () => {
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
})
