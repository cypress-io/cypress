describe "issue 4062",  ->
  afterEach ->
    cy.get("element_does_not_exist", {timeout: 200}).first()

  it "fails with correct chaingin afterEach err when both test and afterEach fail",  ->
    cy.visit("/index.html")
    cy.get("h1", {timeout: 200}).should("have.value", "h2")