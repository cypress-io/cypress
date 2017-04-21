fs         = require("fs-extra")
path       = require("path")
Promise    = require("bluebird")
Fixtures   = require("../helpers/fixtures")
e2e        = require("../helpers/e2e")

fs = Promise.promisifyAll(fs)

noScaffoldingPath = Fixtures.projectPath("no-scaffolding")
supportPath       = path.join(noScaffoldingPath, "cypress", "support")

describe "e2e new project", ->
  e2e.setup()

  it "passes", ->
    fs
    .statAsync(supportPath)
    .then ->
      throw new Error("support folder should not exist")
    .catch =>
      e2e.start(@, {
        project: noScaffoldingPath
        expectedExitCode: 0
      })
      .then ->
        fs.statAsync(supportPath)

