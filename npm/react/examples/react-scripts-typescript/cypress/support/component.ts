/// <reference types="cypress" />

Cypress.Commands.add('clickButtonWithText', (value: string) => {
  return cy.get('button').contains(value).click()
})
