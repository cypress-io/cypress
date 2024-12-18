import App from './App.svelte'

it('should render with style', () => {
  cy.mount(App, {
    // logging due to @packages/app/reporter-ct-mount-hover.cy.ts tests to test the mount log
    log: true,
  })

  cy.contains('Hello World!')
  // Verify global styles
  cy.get('.very-red').should('have.css', 'color', 'rgb(255, 0, 0)')
  // Verify local styles
  cy.get('.very-blue').should('have.css', 'color', 'rgb(0, 0, 255)')
})
