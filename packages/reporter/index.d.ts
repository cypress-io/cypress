/// <reference path="../../cli/types/cy-blob-util.d.ts" />
/// <reference path="../../cli/types/cy-bluebird.d.ts" />
/// <reference path="../../cli/types/cy-moment.d.ts" />
/// <reference path="../../cli/types/cy-minimatch.d.ts" />

/// <reference path="../../cli/types/cypress.d.ts" />
/// <reference path="../../cli/types/cypress-global-vars.d.ts" />
/// <reference path="../../cli/types/cypress-type-helpers.d.ts" />
/// <reference path="../../cli/types/cypress-expect.d.ts" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to take a percy snapshot of the current DOM
     * @example cy.percySnapshot()
    */
    percySnapshot (): Chainable
  }
}
