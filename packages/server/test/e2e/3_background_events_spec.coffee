path     = require("path")

e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

backgroundExtension = Fixtures.projectPath("background-extension")
backgroundConfig = Fixtures.projectPath("background-config")
workingPreprocessor = Fixtures.projectPath("working-preprocessor")
backgroundAsyncError = Fixtures.projectPath("background-async-error")
backgroundAbsolutePath = Fixtures.projectPath("background-absolute-path")
backgroundAfterScreenshot = Fixtures.projectPath("background-after-screenshot")
backgroundPluginsFile = Fixtures.projectPath("background-plugins-file")

describe "e2e background events", ->
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
      project: backgroundAsyncError
      snapshot: true
      expectedExitCode: 1
    })

  it "can modify config from background", ->
    e2e.exec(@, {
      spec: "app_spec.coffee"
      env: "foo=foo,bar=bar"
      config: { pageLoadTimeout: 10000 }
      project: backgroundConfig
      snapshot: true
      expectedExitCode: 0
    })

  it "works with user extensions", ->
    e2e.exec(@, {
      browser: "chrome"
      spec: "app_spec.coffee"
      project: backgroundExtension
      snapshot: true
      expectedExitCode: 0
    })

  it "handles absolute path to backgroundFile", ->
    e2e.exec(@, {
      spec: "absolute_spec.coffee"
      config: {
        backgroundFile: path.join(
          backgroundAbsolutePath,
          "cypress/background/index.js"
        )
      }
      project: backgroundAbsolutePath
      snapshot: true
      expectedExitCode: 0
    })

  it "calls screenshot for cy.screenshot() and failure screenshots", ->
    e2e.exec(@, {
      spec: "after_screenshot_spec.coffee"
      project: backgroundAfterScreenshot
      snapshot: true
      expectedExitCode: 1
    })

  it "errors when pluginsFile is used in config", ->
    e2e.exec(@, {
      spec: "simple_spec.coffee"
      config: "pluginsFile=cypress/integration/background/index.js"
      snapshot: true
      expectedExitCode: 1
    })

  it "errors when backgroundFile path is default and plugins/index.js exists", ->
    e2e.exec(@, {
      project: backgroundPluginsFile
      snapshot: true
      expectedExitCode: 1
    })
