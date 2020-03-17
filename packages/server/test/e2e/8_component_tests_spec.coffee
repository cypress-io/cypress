e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

describe "e2e component tests", ->
  e2e.setup()

  it "runs integration spec file", ->
    e2e.exec(@, {
      project: Fixtures.projectPath("component-tests")
      spec: "integration-spec.js"
    })

  it "runs component spec file"

  it "runs only the integration specs when running all tests"
