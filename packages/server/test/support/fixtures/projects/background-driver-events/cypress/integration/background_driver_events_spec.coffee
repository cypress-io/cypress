it "fails to get", ->
  cy.log("you had logs?")
  cy.get("#non-existent")
