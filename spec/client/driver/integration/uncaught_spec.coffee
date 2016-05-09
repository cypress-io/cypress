describe "Uncaught Integration Tests", ->
  enterIntegrationTestingMode("html/uncaught", {silent: true})

  context "uncaught should not cause 'end' event", ->
    beforeEach ->
      @Cypress.chai.restore()

    it "should successfully run 4 tests, fail 1 and skip 2", (done) ->
      passes   = 0
      failures = 0

      runner = @Cypress.runner.runner

      @Cypress.on "test:end", (test) ->
        if test.state is "passed"
          passes += 1

        if test.state is "failed"
          failures += 1

      @Cypress.run =>
        ## should have 7 total tests
        expect(runner.suite.total()).to.eq(7)

        ## should have 2 suites
        expect(runner.suite.suites.length).to.eq(2)

        expect(passes).to.eq 4
        expect(failures).to.eq 1
        done()
