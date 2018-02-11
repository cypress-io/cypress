describe "security", ->
  it "works by default", ->
    cy.visit("/fixtures/security.html")
    cy.contains("security triggered").should("not.exist")
    cy.get("div").should("not.exist")

  it "can be turned off", ->
    Cypress.config("modifyObstructiveCode", false)

    cy.visit("/fixtures/security.html")
    cy.contains("security triggered")
    cy.get("div")
