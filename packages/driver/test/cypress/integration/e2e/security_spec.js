describe "security", ->
  it "works by replacing obstructive code", ->
    cy.visit("/fixtures/security.html")
    cy.get("div").should("not.exist")
