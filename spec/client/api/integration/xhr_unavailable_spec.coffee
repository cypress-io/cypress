describe "Server Integration Tests", ->
  enterIntegrationTestingMode("html/xhr_unavailable")

  context "server starting prior to visit", ->
    beforeEach ->
      @currentTest.timeout(5000)
      @Cypress.chai.restoreAsserts()

    it "should pass all server tests", (done) ->
      @Cypress.run (failures) ->
        expect(failures).to.eq(0)
        done()
