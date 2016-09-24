e2e = require("../helpers/e2e")

describe "e2e caught and uncaught hooks errors", ->
  e2e.setup()

  it "failing1", ->
    e2e.exec(@, {
      spec: "caught_hook_error_failing_spec.coffee"
      # debug: true
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("4 passing")
      expect(stdout).to.include("1 failing")

      expect(stdout).to.include("✓ t1")
      expect(stdout).to.include("s1")
      expect(stdout).to.include("1) \"before each\" hook")
      expect(stdout).not.to.include("t2")
      expect(stdout).not.to.include("t3")
      expect(stdout).not.to.include("t4")
      expect(stdout).to.include("✓ t5")
      expect(stdout).to.include("✓ t6")
      expect(stdout).to.include("✓ t7")

  it "failing2", ->
    e2e.exec(@, {
      spec: "uncaught_hook_error_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("Uncaught Error: Uncaught ReferenceError: foo is not defined")

      expect(stdout).to.include("1 passing")
      expect(stdout).to.include("1 failing")

      expect(stdout).to.include("t1")
      expect(stdout).to.include("s1")
      expect(stdout).to.include("1) \"before each\" hook")
      expect(stdout).not.to.include("t2")
      expect(stdout).not.to.include("t3")
      expect(stdout).not.to.include("t4")
      expect(stdout).not.to.include("t5")
      expect(stdout).not.to.include("t6")
      expect(stdout).not.to.include("t7")