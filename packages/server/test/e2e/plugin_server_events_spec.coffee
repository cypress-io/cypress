e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

describe "e2e plugins", ->
  e2e.setup()

  it "sends server events", ->
    e2e.exec(@, {
      project: Fixtures.projectPath("plugin-server-events")
      snapshot: true
      expectedExitCode: 1
    })
