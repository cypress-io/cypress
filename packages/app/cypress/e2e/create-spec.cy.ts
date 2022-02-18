import type { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'

function scaffoldAndVisit(project: typeof e2eProjectDirs[number], type: 'component' | 'e2e') {
  cy.scaffoldProject(project)
  cy.openProject(project)
  cy.startAppServer(type)
  cy.__incorrectlyVisitAppWithIntercept()
}

describe('create a spec', () => {
  context('create-react-app-js', () => {
    it('creates a spec for App.jsx', () => {
      scaffoldAndVisit('create-react-app-js', 'component')
      cy.contains('Create from component').click()
      cy.contains('App.jsx').click()
      cy.contains('Okay, run the spec').click()

      // The spec should be found and shown in the spec list
      cy.get('[data-testid="spec-row-item"]').contains('App.cy.jsx')

      // Ensure spec was executed and passed.
      cy.get('.command-state-passed').contains('mount')
      cy.get('.command-state-passed').contains('<App ... />')
    })

    it('creates a spec for Foo.js', () => {
      scaffoldAndVisit('create-react-app-js', 'component')
      cy.contains('Create from component').click()
      cy.contains('Foo.js').click()
      cy.contains('Okay, run the spec').click()

      // The spec should be found and shown in the spec list
      cy.get('[data-testid="spec-row-item"]').contains('Foo.cy.js')

      // Ensure spec was executed and passed.
      cy.get('.command-state-passed').contains('mount')
      cy.get('.command-state-passed').contains('<Foo ... />')
    })
  })
})