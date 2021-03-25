/**
 * We need this file to call window.Cypress
 */
export declare global {
  interface Window {
    Cypress: Cypress.Cypress;
  }
}
