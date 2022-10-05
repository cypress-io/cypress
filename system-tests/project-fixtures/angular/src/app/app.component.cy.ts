import { AppComponent } from './app.component'

it('should', () => {
  cy.mount(AppComponent)
  cy.get('h1').contains('Hello World')
})
