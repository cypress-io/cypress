import App from './App.svelte'

it('should render with style', () => {
  cy.mount(App)
  cy.contains('Hello World!')
  // Verify global styles
  cy.get('.very-red').should('have.css', 'color', 'rgb(255, 0, 0)')
  // Verify local styles
  cy.get('.very-blue').should('have.css', 'color', 'rgb(0, 0, 255)')
})