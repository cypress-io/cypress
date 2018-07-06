path     = require("path")

e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

pluginExtension = Fixtures.projectPath("plugin-extension")
pluginConfig = Fixtures.projectPath("plugin-config")
workingPreprocessor = Fixtures.projectPath("working-preprocessor")
preprocessorAsyncError = Fixtures.projectPath("preprocessor-async-error")
pluginsAbsolutePath = Fixtures.projectPath("plugins-absolute-path")
pluginAfterScreenshot = Fixtures.projectPath("plugin-after-screenshot")

describe "e2e plugins", ->
  e2e.setup()

  it "passes", ->
    e2e.exec(@, {
      spec: "working_preprocessor_spec.coffee"
      project: workingPreprocessor
      snapshot: true
      expectedExitCode: 0
    })

  it "fails on async preprocessor error with support file", ->
    e2e.exec(@, {
      spec: "preprocessor_async_error_spec.coffee"
      project: preprocessorAsyncError
      snapshot: true
      expectedExitCode: 1
    })

  it "can modify config from plugins", ->
    e2e.exec(@, {
      spec: "plugin_config_spec.coffee"
      env: "foo=foo,bar=bar"
      config: "pageLoadTimeout=10000"
      project: pluginConfig
      snapshot: true
      expectedExitCode: 0
    })

  it "works with user extensions", ->
    e2e.exec(@, {
      browser: "chrome"
      spec: "plugin_extension_spec.coffee"
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

  it "calls after:screenshot for cy.screenshot() and failure screenshots", ->
    e2e.exec(@, {
      spec: "after_screenshot_spec.coffee"
      project: pluginAfterScreenshot
      snapshot: true
      expectedExitCode: 1
    })
