describe "$Cypress.Cy Misc Commands", ->
  enterCommandTestingMode()

  context "#end", ->
    it "nulls out the subject", ->
      @cy.noop({}).end().then (subject) ->
        expect(subject).to.be.null
