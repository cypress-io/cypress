e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

describe "e2e issue 2891", ->
  e2e.setup()

  ## https://github.com/cypress-io/cypress/issues/2891

  it "passes", ->
    e2e.exec(@, {
      project: Fixtures.projectPath("default-layout")
      spec: "default_layout_spec.js"
      snapshot: true
      expectedExitCode: 0
    })
