# path     = require("path")

e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

describe "e2e plugins", ->
  e2e.setup()

  it "sends driver events", ->
    e2e.exec(@, {
      spec: "plugin_driver_events_spec.coffee"
      project: Fixtures.projectPath("plugin-driver-events")
      snapshot: true
      expectedExitCode: 1
    })
