path = require("path")

e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

e2ePath = Fixtures.projectPath("e2e")

describe "e2e heavy integration folder", ->
  e2e.setup()

  ## tests that if integrationFolder is set to a folder with a lot of nested
  ## files, Cypress doesn't hang while globbing them
  it "passes", ->
    e2e.exec(@, {
      config: "integrationFolder=#{path.join(__dirname, "../../../..")}"
      spec: path.join(e2ePath, "cypress", "integration", "simple_spec.coffee")
      snapshot: true
      expectedExitCode: 0
    })
