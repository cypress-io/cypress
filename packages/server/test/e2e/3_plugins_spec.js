const path = require('path')

const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

const pluginExtension = Fixtures.projectPath('plugin-extension')
const pluginConfig = Fixtures.projectPath('plugin-config')
const pluginFilterBrowsers = Fixtures.projectPath('plugin-filter-browsers')
const workingPreprocessor = Fixtures.projectPath('working-preprocessor')
const pluginsAsyncError = Fixtures.projectPath('plugins-async-error')
const pluginsAbsolutePath = Fixtures.projectPath('plugins-absolute-path')
const pluginAfterScreenshot = Fixtures.projectPath('plugin-after-screenshot')
const pluginReturnsBadConfig = Fixtures.projectPath('plugin-returns-bad-config')
const pluginReturnsEmptyBrowsersList = Fixtures.projectPath('plugin-returns-empty-browsers-list')
const pluginReturnsInvalidBrowser = Fixtures.projectPath('plugin-returns-invalid-browser')

describe('e2e plugins', () => {
  e2e.setup()

  it('passes', function () {
    return e2e.exec(this, {
      spec: 'app_spec.coffee',
      project: workingPreprocessor,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })
  })

  it('fails', function () {
    return e2e.exec(this, {
      spec: 'app_spec.coffee',
      project: pluginsAsyncError,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('can modify config from plugins', function () {
    return e2e.exec(this, {
      spec: 'app_spec.coffee',
      env: 'foo=foo,bar=bar',
      config: { pageLoadTimeout: 10000 },
      project: pluginConfig,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })
  })

  it('catches invalid viewportWidth returned from plugins', function () {
    // the test project returns config object with a bad value
    return e2e.exec(this, {
      project: pluginReturnsBadConfig,
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('catches invalid browsers list returned from plugins', function () {
    return e2e.exec(this, {
      project: pluginReturnsEmptyBrowsersList,
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('catches invalid browser returned from plugins', function () {
    return e2e.exec(this, {
      project: pluginReturnsInvalidBrowser,
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('can filter browsers from config', function () {
    return e2e.exec(this, {
      project: pluginFilterBrowsers,
      // the test project filters available browsers
      // and returns a list with JUST Electron browser
      // and we ask to run in Chrome
      // thus the test should fail
      browser: 'chrome',
      expectedExitCode: 1,
      snapshot: true,
      // we are interested in the actual filtered available browser name
      // which should be "electron"
      normalizeStdoutAvailableBrowsers: false,
    })
  })

  e2e.it('works with user extensions', {
    browser: 'chrome',
    spec: 'app_spec.coffee',
    headed: true,
    project: pluginExtension,
    sanitizeScreenshotDimensions: true,
    snapshot: true,
  })

  it('handles absolute path to pluginsFile', function () {
    return e2e.exec(this, {
      spec: 'absolute_spec.coffee',
      config: {
        pluginsFile: path.join(
          pluginsAbsolutePath,
          'cypress/plugins/index.js',
        ),
      },
      project: pluginsAbsolutePath,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })
  })

  it('calls after:screenshot for cy.screenshot() and failure screenshots', function () {
    return e2e.exec(this, {
      spec: 'after_screenshot_spec.coffee',
      project: pluginAfterScreenshot,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })
})
