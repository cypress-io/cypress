describe "when visit times out", ->
  it "fails timeout exceeds pageLoadTimeout", ->
    cy.visit("http://localhost:3434/timeout?ms=3000")

  it "fails timeout exceeds timeout option", ->
    cy.visit("http://localhost:3434/timeout?ms=8888", {timeout: 500})
