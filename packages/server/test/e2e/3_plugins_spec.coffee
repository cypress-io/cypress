path     = require("path")

e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

pluginExtension = Fixtures.projectPath("plugin-extension")
pluginConfig = Fixtures.projectPath("plugin-config")
pluginFilterBrowsers = Fixtures.projectPath("plugin-filter-browsers")
workingPreprocessor = Fixtures.projectPath("working-preprocessor")
pluginsAsyncError = Fixtures.projectPath("plugins-async-error")
pluginsAbsolutePath = Fixtures.projectPath("plugins-absolute-path")
pluginAfterScreenshot = Fixtures.projectPath("plugin-after-screenshot")
pluginReturnsBadConfig = Fixtures.projectPath("plugin-returns-bad-config")
pluginReturnsEmptyBrowsersList = Fixtures.projectPath("plugin-returns-empty-browsers-list")
pluginReturnsInvalidBrowser = Fixtures.projectPath("plugin-returns-invalid-browser")

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

  it "catches invalid viewportWidth returned from plugins", ->
    # the test project returns config object with a bad value
    e2e.exec(@, {
      project: pluginReturnsBadConfig
      expectedExitCode: 1
      snapshot: true
    })

  it "catches invalid browsers list returned from plugins", ->
    e2e.exec(@, {
      project: pluginReturnsEmptyBrowsersList
      expectedExitCode: 1
      snapshot: true
    })

  it "catches invalid browser returned from plugins", ->
    e2e.exec(@, {
      project: pluginReturnsInvalidBrowser
      expectedExitCode: 1
      snapshot: true
    })

  it "can filter browsers from config", ->
    e2e.exec(@, {
      project: pluginFilterBrowsers
      # the test project filters available browsers
      # and returns a list with JUST Electron browser
      # and we ask to run in Chrome
      # thus the test should fail
      browser: "chrome"
      expectedExitCode: 1
      snapshot: true
      # we are interested in the actual filtered available browser name
      # which should be "electron"
      normalizeAvailableBrowsers: false
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
