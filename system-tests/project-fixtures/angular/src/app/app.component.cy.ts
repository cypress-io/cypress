import { AppComponent } from './app.component'

it('should', () => {
  cy.mount(AppComponent)
  cy.get('h1').contains('Hello World')
  cy.get('.test-img').should('have.css', 'background-image', 'url("http://localhost:4455/__cypress/src/test.png")')
})
