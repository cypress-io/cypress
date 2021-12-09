import { WIZARD_STEPS } from '@packages/types/src/constants'
import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Launchpad: Setup Project', () => {
  it('no initial setup displays welcome page', () => {
    cy.setupE2E('todos')
    cy.visitLaunchpad()

    cy.contains(WIZARD_STEPS.find((s) => s.type === 'welcome').title).should('be.visible')
    cy.contains('E2E Testing').should('be.visible')
    cy.contains('Component Testing').should('be.visible')
  })

  it('welcome page has button to learn about testing types', () => {
    cy.setupE2E('todos')
    cy.visitLaunchpad()

    cy.contains(defaultMessages.welcomePage.review).click()

    cy.contains('Key Differences').should('be.visible')

    cy.intercept('POST', 'mutation-GlobalPage_OpenInFinder').as('OpenInFinder')

    cy.contais('button', 'Need help?').click()

    cy.wait('@OpenInFinder')
  })
})
