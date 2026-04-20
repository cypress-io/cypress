import { App } from './app'

it('should pass', () => {
  cy.mount(App)
  cy.contains('angular-cli-configured')
})
