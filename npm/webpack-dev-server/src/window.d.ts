/**
 * We need this file to call window.Cypress
 */
declare global {
  interface Window {
    Cypress: Cypress.Cypress;
  }
}
