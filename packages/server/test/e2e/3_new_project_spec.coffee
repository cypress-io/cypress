path       = require("path")
Promise    = require("bluebird")
fs         = require("../../lib/util/fs")
Fixtures   = require("../support/helpers/fixtures")
e2e        = require("../support/helpers/e2e")

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
      e2e.exec(@, {
        project: noScaffoldingPath
        snapshot: true
        expectedExitCode: 0
      })
      .then ->
        fs.statAsync(supportPath)
