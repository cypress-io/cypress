import { ProviderToken } from '@angular/core'
import { TestBed } from '@angular/core/testing'

/**
 * Returns a dependency according to the passed ProviderToken.
 * Calls internally TestBed.inject. In most cases, the token is
 * an Angular service.
 *
 * @param token ProviderToken representing a dependency.
 * @example
 * it('should verify the amount items in the Cart service', () => {
 *   cy.mount(ProductComponent)
 *   cy.inject(Cart).invoke('getItems').should('have.length', 0)
 *   cy.get('[data-testid=btn-buy]').click()
 *   cy.inject(Cart).invoke('getItems').should('have.length', 1)
 * })
 * @returns Cypress.Chainable<T>
 */
export function inject<T> (token: ProviderToken<T>): Cypress.Chainable<T> {
  return cy.wrap(TestBed.inject(token))
}
