declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Yields the body of the reporter iframe (`#reporter-frame`) once
       * the reporter has mounted into it. The reporter renders into its own
       * document, so top-document queries cannot reach it — scope reporter
       * assertions through this command, e.g. `cy.reporter().find('.command')`
       * or `cy.reporter().within(() => { ... })`. The iframe body (rather
       * than the `.reporter` root) is yielded so portaled UI (tooltips,
       * popovers) is also reachable.
       *
       * Note: call this at the top level, not inside a `.within()` block —
       * the frame lookup starts from the document root.
       */
      reporter(options?: { timeout?: number }): Chainable<JQuery<HTMLElement>>
    }
  }
}

export const reporter = (options: { timeout?: number } = {}) => {
  const opts: { log: false, timeout?: number } = { log: false }

  if (options.timeout != null) {
    opts.timeout = options.timeout
  }

  return cy.get('#reporter-frame', opts)
  .its('0.contentDocument.body', opts)
  .should('not.be.empty')
  .then((body) => cy.wrap(body, { log: false }))
  .find('.reporter', opts)
  .then(($reporter) => cy.wrap($reporter.closest('body'), { log: false }))
}

Cypress.Commands.add('reporter', reporter)
