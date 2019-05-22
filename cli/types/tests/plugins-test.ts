/**
 * Test that plugin authors can write .d.ts files to extend Cypress types
 * Unfortunately we cannot test that vendor types located in node_modules are working
 * since those are copied as part of the deploy process
 *
 */

declare namespace Cypress {
  interface cy {
    cyProp: number
	}
	interface Chainable {
    chainerProp: number
  }
}

// $ExpectType number
cy.cyProp

// $ExpectError
cy.get('.element').cyProp

// $ExpectType number
cy.chainerProp

// $ExpectType number
cy.get('.element').chainerProp
