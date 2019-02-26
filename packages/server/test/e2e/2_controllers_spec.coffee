e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

nonExistentSpec = Fixtures.projectPath("non-existent-spec")

describe "e2e plugins", ->
  e2e.setup()

  it "fails when spec does not exist", ->
    e2e.exec(@, {
      spec: "spec.js"
      project: nonExistentSpec
      snapshot: true
      expectedExitCode: 1
    })
