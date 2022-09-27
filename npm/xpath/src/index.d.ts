/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
    * Get one or more DOM elements by an XPath selector.
    * **Note:** you can test XPath expressions from DevTools console using $x(...) function, for example $x('//div') to find all divs.
    * @see https://github.com/cypress-io/cypress-xpath
    * @example
    * cy.xpath(`//ul[@class="todo-list"]//li`)
    *   .should('have.length', 3)
    */
   xpath<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>
  }
}