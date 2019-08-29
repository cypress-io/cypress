Fixtures   = require("../support/helpers/fixtures")
e2e        = require("../support/helpers/e2e")

bustedSupportFile = Fixtures.projectPath("busted-support-file")

describe "e2e busted support file", ->
  e2e.setup()

  it "passes", ->
    e2e.exec(@, {
      project: bustedSupportFile
      snapshot: true
      expectedExitCode: 1
    })
