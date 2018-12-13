# path     = require("path")

e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

describe "e2e background driver events", ->
  e2e.setup()

  it "sends driver events", ->
    e2e.exec(@, {
      spec: "background_driver_events_spec.coffee"
      project: Fixtures.projectPath("background-driver-events")
      snapshot: true
      expectedExitCode: 1
    })
