describe "when content type is plain/text", ->
  it "fails", ->
    cy.visit("/static/hello.txt")