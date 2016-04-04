describe "Ended Early Integration Tests", ->
  ## dont console.error errors else it makes it look
  ## like our tests are failing!
  enterIntegrationTestingMode("html/ended_early", {silent: true})

  context "ended early", ->
    beforeEach ->
      ## we need to restore the assertion
      ## else it will continue to patch
      ## and log out to Cypress!
      @Cypress.chai.restoreAsserts()

    it "does not emit a command log", (done) ->
      logs = []

      @Cypress.on "log", (@log) =>
        logs.push @log

      @Cypress.on "fail", (err) =>
        ## two tests and 1 before each for visiting
        ## means we should only receive 2 logs both
        ## should be visits
        expect(logs.length).to.eq(2)

        names = _(logs).invoke "get", "name"
        expect(names).to.deep.eq ["visit", "visit"]

        done()

      @Cypress.run ->

    it "correctly associates runnable which ended early", (done) ->
      runner = @Cypress.runner

      @Cypress.run (failures) ->
        test = runner.getTestByTitle("does end early [003]")
        expect(test.err.message).to.include "Oops, Cypress detected something wrong with your test code."
        done()
