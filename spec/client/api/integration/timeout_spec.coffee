describe "Timeout Integration Tests", ->
  enterIntegrationTestingMode("html/timeout")

  context "timeouts", ->
    it "has disabled all runnable timeouts", ->
      enableTimeouts = @Cypress.mocha.mocha.options.enableTimeouts
      expect(enableTimeouts).to.be.false

    it "does not time out after visiting", (done) ->
      @timeout(5000)

      ## only run one test
      @Cypress.runner.grep(/visits/)

      @Cypress.run (failures) ->
        expect(failures).to.eq 0
        done()

    it "can time out", (done) ->
      ## only run one test
      @Cypress.runner.grep(/can fail visiting/)

      @Cypress.run (failures) =>
        test = @Cypress.runner.getTestByTitle("can fail visiting")
        expect(test.err.message).to.eq "Cypress command timeout of '500ms' exceeded."
        done()
