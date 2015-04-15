describe "$Cypress.Cy Ensure Extensions", ->
  before ->
    @iframe = $("<iframe />").appendTo $("body")

  beforeEach ->
    @Cypress = $Cypress.create()
    @cy = $Cypress.Cy.create(@Cypress, @iframe)

    ## make sure not to accidentally return
    ## cy else mocha will queue up a .then()
    null

  after ->
    @iframe.remove()

  it "adds 4 methods", ->
    _.each ["Subject", "Parent", "Visibility", "Dom"], (name) =>
      expect(@cy["ensure" + name]).to.be.a("function")
