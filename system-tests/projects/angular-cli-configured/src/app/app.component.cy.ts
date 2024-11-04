import { AppComponent } from './app.component'

it('should pass', () => {
  cy.mount(AppComponent)
  cy.contains('angular-cli-configured')
})
