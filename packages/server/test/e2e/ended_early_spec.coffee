e2e = require("../support/helpers/e2e")

describe "e2e ended early", ->
  e2e.setup()

  it "failing", ->
    e2e.exec(@, {
      spec: "ended_early_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      ## stdout is currently

      # ending early
      #     ✓ does not end early
      #     ✓ does end early (503ms)
      #     1) does end early


      #   2 passing (764ms)
      #   1 failing

      #   1) ending early does end early:
      #      CypressError: Oops, Cypress detected something wrong with your test code.

      ## TODO: this should not have emitted two passing tests (?)
      # expect(stdout).to.include("1 passing")
      # expect(stdout).to.include("1 failing")
      expect(stdout).to.include("Oops, Cypress detected something wrong with your test code.")
      expect(stdout).to.include("The test has finished but Cypress still has commands in its queue.")
      expect(stdout).to.include("The 3 queued commands that have not yet run are:")
      expect(stdout).to.include("- cy.then('...')")
      expect(stdout).to.include("- cy.noop('...')")
      expect(stdout).to.include("- cy.wrap('...')")