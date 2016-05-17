describe "Commands Outside of Test", ->
  enterIntegrationTestingMode("html/commands_outside_of_test")

  context "commands outside of test", ->
    beforeEach ->
      @currentTest.timeout(5000)
      @Cypress.chai.restoreAsserts()

    it "should not fail", (done) ->
      @Cypress.run (failures) ->
        expect(failures).to.eq(0)
        done()
