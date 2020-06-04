e2e = require("../support/helpers/e2e").default
Fixtures = require("../support/helpers/fixtures")

uncaughtSupportFile = Fixtures.projectPath("uncaught-support-file")

describe "e2e uncaught support file errors", ->
  e2e.setup()

  it "failing", ->
    e2e.exec(@, {
      project: uncaughtSupportFile
      sanitizeScreenshotDimensions: true
      snapshot: true
      expectedExitCode: 1
    })
