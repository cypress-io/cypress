halfTests = Cypress.env('NUM_TESTS') / 2
msPerTest = Cypress.env('MS_PER_TEST')

Cypress._.times halfTests, (i) ->
  it "num: #{i+1} makes some long tests", ->
    cy.wait(msPerTest)

it "top-level navigation", ->
  cy.visit('http://localhost:38883')

Cypress._.times halfTests, (i) ->
  it "num: #{i+1 + halfTests} makes some long tests", ->
    cy.wait(msPerTest)
