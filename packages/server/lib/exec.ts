// This module is retained, and imported by privileged-commands-manager, only so
// that it stays in the V8 snapshot bundle. Dropping it from the bundle makes
// `mksnapshot` abort with no diagnostic.
export const run = () => {
  throw new Error('`cy.exec()` was removed in Cypress 16.0.0. Use `cy.task()` instead.')
}
