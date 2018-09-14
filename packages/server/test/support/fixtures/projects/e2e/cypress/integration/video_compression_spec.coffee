Cypress._.times 40, (i) ->
  it "num: #{i+1} makes some long tests", ->
    cy.wait(500)
