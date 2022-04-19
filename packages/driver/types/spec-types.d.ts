// NOTE: This is for internal Cypress spec types that exist in support/utils.js for testing convenience and do not ship with Cypress

declare namespace Cypress {
  interface Chainable {
    getAll(...aliases: string[]): Chainable
    shouldWithTimeout(cb: (subj: {}) => void, timeout?: number): Chainable
  }
}
