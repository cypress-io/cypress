e2e = require("../support/helpers/e2e")

describe "e2e js error handling", ->
  e2e.setup({
    servers: {
      port: 1122
      static: true
    }
  })

  it "fails", ->
    e2e.exec(@, {
      spec: "js_error_handling_failing_spec.coffee"
      expectedExitCode: 5
    })
    .get("stdout")
    .then (stdout) ->
      ## the should('have.class', 'active') assertions should not have
      ## been executed due to errors happening on the previous command(s)
      expect(stdout).not.to.include("class")
      expect(stdout).not.to.include("active")

      expect(stdout).to.include("Uncaught ReferenceError: foo is not defined")

      expect(stdout).to.include("bar is not defined")

      expect(stdout).to.include("Uncaught Error: Script error.")
      expect(stdout).to.include("Cypress detected that an uncaught error was thrown from a cross origin script.")

      expect(stdout).to.include("2 passing")
      expect(stdout).to.include("5 failing")

      expect(stdout).not.to.include("should have failed but did not")
