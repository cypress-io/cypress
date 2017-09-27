describe "Cypress.config()", ->
  it "has Cypress.version set to a string", ->
    expect(Cypress.version).to.be.a("string")
