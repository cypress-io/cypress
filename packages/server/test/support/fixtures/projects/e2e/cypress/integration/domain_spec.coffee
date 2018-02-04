describe "localhost", ->
  it "can visit", ->
    cy.visit("http://app.localhost:4848")
