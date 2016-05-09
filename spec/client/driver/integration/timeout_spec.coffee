describe "Timeout Integration Tests", ->
  enterIntegrationTestingMode("html/timeout", {silent: true})

  context "timeouts", ->
    beforeEach ->
      @Cypress.chai.restore()

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