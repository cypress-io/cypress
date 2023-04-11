import { AppComponent } from './app.component'

it('works', () => {
  cy.mount(AppComponent)
  cy.get('h1').contains('Welcome to Angular with NX!')
})