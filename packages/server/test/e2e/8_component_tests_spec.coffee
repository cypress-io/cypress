e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")
snapshot = require("snap-shot-it")
path = require("path")

describe "e2e component tests", ->
  e2e.setup()

  project = Fixtures.projectPath("component-tests")

  it "runs just the integration spec file", ->
    e2e.exec(@, {
      project,
      spec: "integration-spec.js",
      config: {
        video: false
      }
    })
    .then (result) ->
      runSummary = e2e.leaveRunFinishedTable(e2e.normalizeStdout(result.stdout))
      snapshot('integration spec run', runSummary)

  it "runs component spec file", ->
    # for now the component spec should use full path
    spec = path.join(project, "cypress/component-tests/foo.spec.js")
    e2e.exec(@, {
      project,
      spec,
      config: {
        video: false
      }
    })
    .then (result) ->
      runSummary = e2e.leaveRunFinishedTable(e2e.normalizeStdout(result.stdout))
      console.log(runSummary)

  it "runs integration and component spec file when running all tests", ->
    e2e.exec(@, {
      project,
      config: {
        video: false
      }
    })
    .then (result) ->
      runSummary = e2e.leaveRunFinishedTable(e2e.normalizeStdout(result.stdout))
      snapshot('all tests results summary', runSummary)
