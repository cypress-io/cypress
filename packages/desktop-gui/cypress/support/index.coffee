  Cypress.addParentCommand "shouldBeOnLogin", () ->
    cy
      .location().its("hash")
        .should("contain", "login")
