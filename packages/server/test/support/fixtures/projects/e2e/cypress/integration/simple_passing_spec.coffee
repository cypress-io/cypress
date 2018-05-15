describe "simple passing spec", ->
  beforeEach ->
    cy.wait(1000)

  it "passes", ->
    cy.wrap(true).should("be.true")
