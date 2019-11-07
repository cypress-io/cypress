path     = require("path")

e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

pluginExtension = Fixtures.projectPath("plugin-extension")
pluginConfig = Fixtures.projectPath("plugin-config")
workingPreprocessor = Fixtures.projectPath("working-preprocessor")
pluginsAsyncError = Fixtures.projectPath("plugins-async-error")
pluginsAbsolutePath = Fixtures.projectPath("plugins-absolute-path")
pluginAfterScreenshot = Fixtures.projectPath("plugin-after-screenshot")

describe "e2e plugins", ->
  e2e.setup()

  it "passes", ->
    e2e.exec(@, {
      spec: "app_spec.coffee"
      project: workingPreprocessor
      sanitizeScreenshotDimensions: true
      snapshot: true
      expectedExitCode: 0
    })

  it "fails", ->
    e2e.exec(@, {
      spec: "app_spec.coffee"
      project: pluginsAsyncError
      sanitizeScreenshotDimensions: true
      snapshot: true
      expectedExitCode: 1
    })

  it "can modify config from plugins", ->
    e2e.exec(@, {
      spec: "app_spec.coffee"
      env: "foo=foo,bar=bar"
      config: { pageLoadTimeout: 10000 }
      project: pluginConfig
      sanitizeScreenshotDimensions: true
      snapshot: true
      expectedExitCode: 0
    })

  e2e.it "works with user extensions", {
    browser: "chrome"
    spec: "app_spec.coffee"
    project: pluginExtension
    sanitizeScreenshotDimensions: true
    snapshot: true
    expectedExitCode: 0
  }

  it "handles absolute path to pluginsFile", ->
    e2e.exec(@, {
      spec: "absolute_spec.coffee"
      config: {
        pluginsFile: path.join(
          pluginsAbsolutePath,
          "cypress/plugins/index.js"
        )
      }
      project: pluginsAbsolutePath
      sanitizeScreenshotDimensions: true
      snapshot: true
      expectedExitCode: 0
    })

  it "calls after:screenshot for cy.screenshot() and failure screenshots", ->
    e2e.exec(@, {
      spec: "after_screenshot_spec.coffee"
      project: pluginAfterScreenshot
      sanitizeScreenshotDimensions: true
      snapshot: true
      expectedExitCode: 1
    })
