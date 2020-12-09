invokedDoesNotRun = false
invokedDoesRun = false
afterVisitCommand = false
runnableAfterRunAsync = []
testAfterRun = []

Cypress.on "runnable:after:run:async", (obj, runnable) ->
  if obj.err
    runnableAfterRunAsync.push(obj.title)

Cypress.on "test:after:run", (test) ->
  testAfterRun.push(test.title)

describe "uncaught hook error should continue to fire all mocha events", ->
  context "s1", ->
    beforeEach ->
      ## when this beforeEach hook fails
      ## it will skip invoking the test
      ## but run the other suite
      cy.visit("http://localhost:7878/visit_error.html").then ->
        ## it should cancel the command queue on
        ## uncaught error and NOT reach this code
        afterVisitCommand = true

    ## TODO: look at why this is running.......
    it "does not run", ->
      invokedDoesNotRun = true

  context "s2", ->
    it "does run", ->
      invokedDoesRun = true

    it "also runs", ->
      ## should not have executed the body of this test
      expect(invokedDoesNotRun, "1st").to.be.false

      ## should have executed the body of this test
      expect(invokedDoesRun, "2nd").to.be.true

      ## should not have reached command after visit
      expect(afterVisitCommand, "3rd").to.be.false

      expect(runnableAfterRunAsync).to.deep.eq([
        '"before each" hook'
      ])

      ## our last test here has not yet pushed into test:after:run
      expect(testAfterRun).to.deep.eq([
        ## even though the test code itself did not
        ## run, we should still receive a test:after:run
        ## event for this
        "does not run",

        ## and this test should continue running normally
        "does run"
      ])
