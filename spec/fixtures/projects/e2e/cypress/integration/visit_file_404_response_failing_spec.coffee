describe "when file server response is 404", ->
  it "fails", ->
    cy.visit("/static/does-not-exist.html")