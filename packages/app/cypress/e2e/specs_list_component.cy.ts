import { getPathForPlatform } from '../../src/paths'

describe('App: Spec List (Component)', () => {
  beforeEach(() => {
    cy.scaffoldProject('component-tests')
    cy.openProject('component-tests', ['--component'])
    cy.startAppServer('component')
    cy.visitApp()
    cy.specsPageIsVisible()
  })

  it('opens spec pattern modal', () => {
    cy.contains('button', 'View spec pattern').click()

    cy.get('[data-cy="spec-pattern-modal"]').should('be.visible')
    cy.get('[data-cy="spec-pattern"]').contains('cypress/component-tests/*.spec.js')

    cy.contains('button', 'Update spec pattern').click()
    cy.get('[data-cy="choose-editor-modal"]').should('be.visible').within(() => {
      cy.get('[aria-label="Close"]').click()
    })

    cy.contains('button', 'Dismiss').click()
    cy.get('[data-cy="spec-pattern-modal"]').should('not.exist')
  })

  it('highlights the currently running spec', () => {
    cy.contains('fails').click()
    cy.contains('[aria-controls=reporter-inline-specs-list]', 'Specs')
    cy.get('body').type('f')
    cy.get('[data-selected-spec="true"]').should('contain', 'fails')
    cy.get('[data-selected-spec="false"]').should('contain', 'foo')
  })

  it('opens the "Create new spec" modal after clicking the "New specs" button', () => {
    cy.get('[data-cy="standard-modal"]').should('not.exist')
    cy.get('[data-cy="new-spec-button"]').click()
    cy.get('[data-cy="standard-modal"]').get('h2').contains('Enter the path for your new spec')
    cy.get('button').get('[aria-label="Close"]').click()
    cy.get('[data-cy="standard-modal"]').should('not.exist')
  })

  it('has the correct defaultSpecFileName in the "Create new spec" modal', () => {
    cy.findByTestId('standard-modal').should('not.exist')
    cy.findByTestId('new-spec-button').click()
    cy.get('input').get('[aria-label="Enter a relative path..."]').invoke('val').should('contain', getPathForPlatform('cypress/component-tests/ComponentName.spec.js'))
  })
})
