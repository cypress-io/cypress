/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    clickButtonWithText(text: string): Chainable
  }
}
