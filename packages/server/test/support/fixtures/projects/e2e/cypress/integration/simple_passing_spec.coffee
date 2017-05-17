describe "simple passing spec", ->
  it "passes", ->
    cy.wrap(true).should("be.true")