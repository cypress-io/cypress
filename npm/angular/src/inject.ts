import { ProviderToken } from '@angular/core'
import { TestBed } from '@angular/core/testing'

/**
 * Returns a dependency according to the passed ProviderToken. Calls internally TestBed.inject.
 *
 * @param {ProviderToken<T>>} providerToken ProviderToken representing a dependency
 * @example
 * import { HelloWorldComponent } from 'hello-world/hello-world.component'
 * import { MyService } from 'services/my.service'
 * import { SharedModule } from 'shared/shared.module';
 * import { mount } from '@cypress/angular'
 * it('can mount', () => {
 *  mount(HelloWorldComponent, {
 *    providers: [MyService],
 *    imports: [SharedModule]
 *  })
 *  cy.get('h1').contains('Hello World')
 * })
 *
 * or
 *
 * it('can mount with template', () => {
 *  mount('<app-hello-world></app-hello-world>', {
 *    declarations: [HelloWorldComponent],
 *    providers: [MyService],
 *    imports: [SharedModule]
 *  })
 * })
 * @returns Cypress.Chainable<T>
 */
export function inject<T> (token: ProviderToken<T>): Cypress.Chainable<T> {
  return cy.wrap(TestBed.inject(token))
}
