e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

describe "e2e stdout", ->
  e2e.setup()

  it "displays errors from failures", ->
    e2e.exec(@, {
      port: 2020
      snapshot: true
      spec: "stdout_failing_spec.coffee"
      expectedExitCode: 3
    })

  it "displays errors from exiting early due to bundle errors", ->
    e2e.exec(@, {
      spec: "stdout_exit_early_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })

  it "does not duplicate suites or tests between visits", ->
    e2e.exec(@, {
      spec: "stdout_passing_spec.coffee"
      timeout: 120000
      snapshot: true
      expectedExitCode: 0
    })

  it "logs that electron cannot be recorded in headed mode", ->
    e2e.exec(@, {
      spec: "simple_spec.coffee"
      headed: true
      snapshot: true
      expectedExitCode: 0
    })

  it "logs that chrome cannot be recorded", ->
    e2e.exec(@, {
      spec: "simple_spec.coffee"
      browser: "chrome"
      snapshot: true
      expectedExitCode: 0
    })
