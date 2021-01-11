Cypress._.times Cypress.env('NUM_TESTS'), (i) ->
  it "num: #{i+1} makes some long tests", ->
    cy.wait(Cypress.env('MS_PER_TEST'))
