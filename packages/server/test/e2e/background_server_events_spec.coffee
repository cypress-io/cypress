e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

describe "e2e background server events", ->
  e2e.setup()

  it "sends server events", ->
    e2e.exec(@, {
      project: Fixtures.projectPath("background-server-events")
      snapshot: true
      expectedExitCode: 1
    })

  it "fails run if server event handler throws", ->
    e2e.exec(@, {
      project: Fixtures.projectPath("background-server-events-throw")
      snapshot: true
      expectedExitCode: 1
    })
