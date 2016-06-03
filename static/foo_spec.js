

describe("playground", function() {
  return it("is true", function() {
    cy.viewport(500, 500)
    cy.visit("test.html")
    cy.get('h1').should('have.text', 'Hello, World')
    cy
      .get('#input').clear().type('Friend')
      .get('button').click()
    cy.get('h1').should('have.text', 'Hello, Friend')
  });
});
