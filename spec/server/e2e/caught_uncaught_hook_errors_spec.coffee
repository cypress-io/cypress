Fixtures = require("../helpers/fixtures")
e2e      = require("../helpers/e2e")

e2ePath = Fixtures.projectPath("e2e")

afterHookCount = 0
afterRunCount  = 0

onServer = (app) ->
  app.get "/hook", (req, res) ->
    afterHookCount += 1

    res.send("<html>#{afterHookCount}</html>")

  app.get "/run", (req, res) ->
    afterRunCount += 1

    res.send("<html>#{afterRunCount}</html>")

describe "e2e caught and uncaught hooks errors", ->
  e2e.setup({
    servers: {
      port: 7878
      static: true
      onServer: onServer
    }
  })

  it "failing1", ->
    e2e.exec(@, {
      spec: "caught_hook_error_failing_spec.coffee"
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

  it "failing3", ->
    e2e.start(@, {
      spec: "uncaught_hook_error_events_failing_spec.coffee"
      expectedExitCode: 1
    })
    .then ->
      expect(afterHookCount).to.eq(1)
      expect(afterRunCount).to.eq(1)
