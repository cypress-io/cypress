path     = require("path")

e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

pluginExtension = Fixtures.projectPath("plugin-extension")
pluginConfig = Fixtures.projectPath("plugin-config")
workingPreprocessor = Fixtures.projectPath("working-preprocessor")
pluginsAsyncError = Fixtures.projectPath("plugins-async-error")
pluginsAbsolutePath = Fixtures.projectPath("plugins-absolute-path")

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

  it "works with user extensions", ->
    e2e.exec(@, {
      browser: "chrome"
      spec: "app_spec.coffee"
      project: pluginExtension
      snapshot: true
      expectedExitCode: 0
    })

  it "handles absolute path to pluginsFile", ->
    e2e.exec(@, {
      spec: "absolute_spec.coffee"
      config: "pluginsFile=#{path.join(pluginsAbsolutePath, "cypress/plugins/index.js")}"
      project: pluginsAbsolutePath
      snapshot: true
      expectedExitCode: 0
    })
