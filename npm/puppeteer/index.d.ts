/// <reference types="Cypress" />

declare namespace Cypress {
  interface Chainable {
    puppeteer(messageName: string, ...args: any[]): Chainable
  }
}
