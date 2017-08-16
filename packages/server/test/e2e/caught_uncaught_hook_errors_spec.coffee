Fixtures = require("../support/helpers/fixtures")
e2e      = require("../support/helpers/e2e")

e2ePath = Fixtures.projectPath("e2e")

describe "e2e caught and uncaught hooks errors", ->
  e2e.setup({
    servers: {
      port: 7878
      static: true
    }
  })

  it "failing1", ->
    e2e.exec(@, {
      spec: "hook_caught_error_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("4 passing")
      expect(stdout).to.include("1 failing")

      expect(stdout).to.include("✓ t1a")
      expect(stdout).to.include("s1a")
      expect(stdout).to.include("1) \"before each\" hook for \"t2a\"")
      expect(stdout).not.to.include("t3a")
      expect(stdout).not.to.include("t4a")
      expect(stdout).to.include("✓ t5a")
      expect(stdout).to.include("✓ t6a")
      expect(stdout).to.include("✓ t7a")
      expect(stdout).to.include("1) s1a \"before each\" hook for \"t2a\":")

  it "failing2", ->
    e2e.exec(@, {
      spec: "hook_uncaught_error_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("Uncaught ReferenceError: foo is not defined")
      expect(stdout).to.include("Because this error occured during a 'before each' hook we are skipping the remaining tests in the current suite: 's1b'")

      expect(stdout).to.include("4 passing")
      expect(stdout).to.include("1 failing")

      expect(stdout).to.include("t1b")
      expect(stdout).to.include("s1b")
      expect(stdout).to.include("1) \"before each\" hook for \"t2b\"")
      expect(stdout).not.to.include("t3b")
      expect(stdout).not.to.include("t4b")
      expect(stdout).to.include("t5b")
      expect(stdout).to.include("t6b")
      expect(stdout).to.include("t7b")
      expect(stdout).to.include("1) s1b \"before each\" hook for \"t2b\":")

  it "failing3", ->
    e2e.exec(@, {
      spec: "hook_uncaught_root_error_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("Uncaught ReferenceError: foo is not defined")
      expect(stdout).to.include("Because this error occured during a 'before each' hook we are skipping all of the remaining tests.")

      expect(stdout).to.include("0 passing")
      expect(stdout).to.include("1 failing")

      expect(stdout).to.include("1) \"before each\" hook for \"t1c\"")
      expect(stdout).not.to.include("t2c")
      expect(stdout).not.to.include("t3c")
      expect(stdout).not.to.include("t4c")

  it "failing4", ->
    e2e.start(@, {
    e2e.exec(@, {
      spec: "hook_uncaught_error_events_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("Uncaught ReferenceError: foo is not defined")
