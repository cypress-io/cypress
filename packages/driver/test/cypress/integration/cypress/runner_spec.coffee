describe "src/cypress/runner", ->
  context "pending tests", ->
    pending = []

    beforeEach ->
      cy.on "test:after:run", (test) ->
        if test.state is "pending"
          pending.push(test)

      return null

    it "is not pending", ->

    it "is pending 1"

    it "is pending 2"

    it "has 2 pending tests", ->
      expect(pending).to.have.length(2)

      expect(pending[0].title).to.eq("is pending 1")
      expect(pending[1].title).to.eq("is pending 2")
