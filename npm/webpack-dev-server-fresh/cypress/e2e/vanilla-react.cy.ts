/// <reference types="cypress" />
/// <reference path="../support/e2e.ts" />

describe('vanilla-react.cy.ts', () => {
  beforeEach(() => {
    cy.scaffoldProject('wds-vanilla-react')
    cy.openProject('wds-vanilla-react')
    cy.startAppServer('component')
  })

  it('should visit', () => {
    cy.visitApp()
    cy.contains('App.cy.jsx').click()
  })
})
