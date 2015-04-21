describe "Done Integration Tests", ->
  enterCommandTestingMode()

  context "explicitly calling done", ->
    beforeEach ->
      @allowErrors()

      cy.noop({})

    it "throws when test is explictly ended early", (done) ->
      @cy.on "fail", (err) ->
        expect(err.message).to.eq "Cypress detected your test ended early before all of the commands have run. This can happen if you explicitly done() a test before all of the commands have finished."
        done()

      @cy.then ->

      done()

    it "does not emit a command log", (done) ->
      @Cypress.on "log", (@log) =>

      @cy.on "fail", (err) =>
        expect(@log).not.to.be.ok
        done()

      @cy.then ->

      done()
