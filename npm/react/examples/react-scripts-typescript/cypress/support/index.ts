/// <reference types="cypress" />

Cypress.Commands.add('clickButtonWithText', (value: string) => {
  console.log(value)
  return cy.get('button').contains(value).click()
})
