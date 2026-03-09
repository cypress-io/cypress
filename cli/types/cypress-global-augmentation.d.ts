/**
 * Augments Window so that Cypress globals (Cypress, cy, expect, assert)
 * are correctly typed when accessed as window.Cypress, window.cy, etc.
 * Must be an external module so that declare global is allowed.
 */
export {}

declare global {
  interface Window {
    Cypress: Cypress.Cypress & CyEventEmitter
    cy: Cypress.cy & CyEventEmitter
    expect: Chai.ExpectStatic
    assert: Chai.AssertStatic
  }
}
