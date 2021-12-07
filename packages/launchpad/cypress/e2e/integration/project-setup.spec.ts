import { WIZARD_STEPS } from '@packages/types/src/constants'
import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Launchpad: Setup Project', () => {
  it('no initial setup displays welcome page', () => {
    cy.setupE2E('todos')
    cy.visitLaunchpad()

    cy.get('h1').should('contain', WIZARD_STEPS.find((s) => s.type === 'welcome').title)
    cy.get('h2').should('contain', 'E2E Testing')
    cy.get('h2').should('contain', 'Component Testing')
  })

  it('welcome page has button to learn about testing types', () => {
    cy.setupE2E('todos')
    cy.visitLaunchpad()

    cy.get('button.hocus-link-default')
    .should('contain', defaultMessages.welcomePage.review)
    .click()

    cy.get('h2').should('contain', 'Key Differences')

    cy.intercept('POST', 'mutation-GlobalPage_OpenInFinder').as('OpenInFinder')

    cy.get('a[href="https://on.cypress.io"]')
    .should('contain', 'Need help?')
    .click()

    cy.wait('@OpenInFinder')
  })
})
