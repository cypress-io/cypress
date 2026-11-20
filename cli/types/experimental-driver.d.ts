// Queries that only exist when the experimental driver is enabled with
// `CYPRESS_INTERNAL_EXPERIMENTAL_DRIVER=1`. `index.d.ts` leaves this file out, so
// they only type-check in a project that opts in:
//
//   /// <reference types="cypress/types/experimental-driver" />

declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Traverse into the `<body>` of an iframe's document, whatever its origin.
     *
     * @example
     *    cy.get('iframe#checkout')
     *    .frame()
     *    .find('#card-number')
     *    .type('4242 4242 4242 4242')
     */
    frame(options?: Partial<LogTimeoutOptions>): Chainable<JQuery<HTMLBodyElement>>

    /**
     * Get the `<body>` of a tab the app opened, such as a login popup. A string matches any
     * part of the tab's URL, and with no URL the newest tab is used.
     *
     * @example
     *    cy.get('#sign-in-with-idp').click()
     *    cy.tab(/login\.idp/).find('#username').type('ada')
     */
    tab(url?: string | RegExp, options?: Partial<LogTimeoutOptions>): Chainable<JQuery<HTMLBodyElement>>
  }
}
