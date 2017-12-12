e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

pluginConfig = Fixtures.projectPath("plugin-config")
workingPreprocessor = Fixtures.projectPath("working-preprocessor")
pluginsAsyncError = Fixtures.projectPath("plugins-async-error")

describe "e2e plugins", ->
  e2e.setup()

  it "passes", ->
    e2e.exec(@, {
      spec: "app_spec.coffee"
      project: workingPreprocessor
      snapshot: true
      expectedExitCode: 0
    })

  it "fails", ->
    e2e.exec(@, {
      spec: "app_spec.coffee"
      project: pluginsAsyncError
      snapshot: true
      expectedExitCode: 1
    })

  it "can modify config from plugins", ->
    e2e.exec(@, {
      spec: "app_spec.coffee"
      env: "foo=foo,bar=bar"
      config: "pageLoadTimeout=10000"
      project: pluginConfig
      snapshot: true
      expectedExitCode: 0
    })
