// NOTE: this is for internal Cypress types that we don't want exposed in the public API but want for development
// TODO: find a better place for this

declare namespace Cypress {
  interface Cypress {
    // TODO: how to pull these from resolvers.ts? can't import in a d.ts file...
    resolveWindowReference: any
    resolveLocationReference: any
    state: Cypress.state
  }

  // Cypress.state is also accessible on cy.state
  interface cy {
    state: Cypress.State
  }

  // Extend Cypress.state properties here
  interface ResolvedConfigOptions {
    $autIframe: JQuery<HTMLIFrameElement>
    document: Document
  }
}
