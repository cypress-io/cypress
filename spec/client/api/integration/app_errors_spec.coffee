describe "App Errors Tests", ->
  enterIntegrationTestingMode("html/errors", {silent: true})

  context "should not fire ended early event", ->
    beforeEach ->
      @currentTest.timeout(5000)
      @Cypress.chai.restore()

    it "should have caught uncaught reference err and xhr error", (done) ->
      runner = @Cypress.runner.runner

      ## should not trigger fail function
      ## because this should have hit uncaught error
      @Cypress.cy.on "fail", (err) ->
        done(err)

      @Cypress.run (failures) =>
        tests = runner.suite.suites[0].tests

        expect(tests[0].err.message).to.include("foo is not defined")
        expect(tests[1].err.name).to.eq("ReferenceError")
        expect(tests[1].err.message).to.eq("bar is not defined")

        done()
