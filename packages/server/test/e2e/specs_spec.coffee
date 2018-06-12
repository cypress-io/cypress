e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

e2ePath = Fixtures.projectPath("e2e")

describe "e2e specs", ->
  e2e.setup()

  it "failing when no specs found", ->
    e2e.exec(@, {
      config: "integrationFolder=cypress/specs"
      snapshot: true
      expectedExitCode: 1
    })

  it "failing when no spec pattern found", ->
    e2e.exec(@, {
      spec: "cypress/integration/**notfound**"
      snapshot: true
      expectedExitCode: 1
    })
