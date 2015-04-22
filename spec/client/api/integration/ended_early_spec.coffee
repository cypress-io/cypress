describe "Timeout Integration Tests", ->
  ## dont console.error errors else it makes it look
  ## like our tests are failing!
  enterIntegrationTestingMode("html/ended_early", {silent: true})

  context "ended early", ->
    it "correct associates runnable which ended early", (done) ->
      runner = @Cypress.runner

      @Cypress.run (failures) ->
        test = runner.getTestByTitle("does end early [003]")
        expect(test.err.message).to.eq "Cypress detected your test ended early before all of the commands have run. This can happen if you explicitly done() a test before all of the commands have finished."
        done()
