Cypress.Commands.add('render', (r, component) => {
  cy.window().invoke('renderComponent', (el) => r(component, el))
})
