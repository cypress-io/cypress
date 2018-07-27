describe "record pass", ->
  it "passes", ->
    cy.visit("/scrollable.html")
    cy
      .viewport(400, 400)
      .get("#box")
      .screenshot('yay it passes')

  it "is pending"
