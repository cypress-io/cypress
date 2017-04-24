describe "when network connection cannot be established", ->
  it "fails", ->
    cy.visit("http://localhost:16795")