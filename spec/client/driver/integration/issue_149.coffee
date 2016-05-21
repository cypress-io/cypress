## https://github.com/cypress-io/cypress/issues/149

describe "issue 149", ->
  enterIntegrationTestingMode("html/issue_149")

  context "runs all commands", ->
    beforeEach ->
      @currentTest.timeout(5000)
      @Cypress.chai.restoreAsserts()

    it "window.executedAllCommands=true", (done) ->
      @Cypress.run =>
        expect(@$iframe.prop("contentWindow").executedAllCommands).to.be.true
        done()
