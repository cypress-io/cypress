## https://github.com/cypress-io/cypress/issues/173

describe "issue 173", ->
  enterIntegrationTestingMode("html/issue_173", {silent: true})

  context "runs both tests", ->
    beforeEach ->
      @currentTest.timeout(5000)
      @Cypress.chai.restoreAsserts()

    it "should only fail the first", (done) ->
      @Cypress.run (failures) ->
        expect(failures).to.eq(1)
        done()
