const path = require('path')

const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')

const e2eProject = Fixtures.projectPath('e2e')

describe('e2e plugins', function () {
  systemTests.setup()

  // this tests verifies stdout manually instead of via snapshot because
  // there's a degree of randomness as to whether the error occurs before or
  // after the run output starts. the important thing is that the run is
  // failed and the right error is displayed
  systemTests.it('fails when there is an async error at the root', {
    browser: 'chrome',
    spec: 'app.cy.js',
    project: 'plugins-root-async-error',
    expectedExitCode: 1,
    onRun (exec) {
      return exec().then(({ stdout }) => {
        expect(stdout).to.include('We stopped running your tests because your config file crashed.')
        expect(stdout).to.include('Your configFile threw an error from: cypress.config.js')
        expect(stdout).to.include('Error: Root async error from config file')
      })
    },
  })

  it('fails when there is an async error inside an event handler', function () {
    return systemTests.exec(this, {
      spec: 'app.cy.js',
      project: 'plugins-async-error',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('can modify config from plugins', function () {
    return systemTests.exec(this, {
      spec: 'app.cy.js',
      env: 'foo=foo,bar=bar',
      config: { pageLoadTimeout: 10000 },
      project: 'plugin-config',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })
  })

  it('passes version correctly', function () {
    return systemTests.exec(this, {
      project: 'plugin-config-version',
    })
  })

  it('catches invalid viewportWidth returned from plugins', function () {
    // the test project returns config object with a bad value
    return systemTests.exec(this, {
      project: 'plugin-returns-bad-config',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('catches invalid browsers list returned from plugins', function () {
    return systemTests.exec(this, {
      project: 'plugin-returns-empty-browsers-list',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('catches invalid browser returned from plugins', function () {
    return systemTests.exec(this, {
      project: 'plugin-returns-invalid-browser',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('can filter browsers from config', function () {
    return systemTests.exec(this, {
      project: 'plugin-filter-browsers',
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

  systemTests.it('works with user extensions', {
    browser: 'chrome',
    spec: 'app.cy.js',
    headed: true,
    project: 'plugin-extension',
    sanitizeScreenshotDimensions: true,
    snapshot: true,
  })

  const pluginAfterScreenshot = 'plugin-after-screenshot'

  it('calls after:screenshot for cy.screenshot() and failure screenshots', function () {
    return systemTests.exec(this, {
      spec: 'after_screenshot.cy.js',
      project: pluginAfterScreenshot,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  // https://github.com/cypress-io/cypress/issues/8079
  it('does not report more screenshots than exist if user overwrites previous screenshot in afterScreenshot', function () {
    return systemTests.exec(this, {
      spec: 'after_screenshot_overwrite.cy.js',
      project: pluginAfterScreenshot,
      snapshot: true,
    })
  })

  it('fails when invalid event is registered', function () {
    return systemTests.exec(this, {
      spec: 'app.cy.js',
      project: 'plugin-validation-error',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('fails when invalid event handler is registered', function () {
    return systemTests.exec(this, {
      spec: 'app.cy.js',
      project: 'plugin-invalid-event-handler-error',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('fails when setupNodeEvents is not a function', function () {
    return systemTests.exec(this, {
      spec: 'app.cy.js',
      project: 'plugin-empty',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('fails when there is no function exported', function () {
    return systemTests.exec(this, {
      spec: 'app_spec.js',
      project: 'plugin-no-function-return',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('fails when require throws synchronously', function () {
    return systemTests.exec(this, {
      spec: 'app_spec.js',
      project: 'plugins-root-sync-error',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('fails when require has a syntax error', function () {
    return systemTests.exec(this, {
      spec: 'app_spec.js',
      project: 'plugins-root-syntax-error',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('fails when function throws synchronously', function () {
    return systemTests.exec(this, {
      spec: 'app_spec.js',
      project: 'plugins-function-sync-error',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  describe('preprocessor', function () {
    it('passes with working preprocessor', function () {
      return systemTests.exec(this, {
        spec: 'app.cy.js',
        project: 'working-preprocessor',
        sanitizeScreenshotDimensions: true,
        snapshot: true,
      })
    })

    it('supports node builtins', function () {
      return systemTests.exec(this, {
        spec: 'node_builtins.cy.js',
      })
    })

    // https://github.com/cypress-io/cypress/issues/8361
    it('supports .mjs files', function () {
      return systemTests.exec(this, {
        spec: 'mjs_spec.cy.mjs',
      })
    })
  })

  describe('extra properties', function () {
    it('passes projectRoot and default configFile to plugins function', function () {
      return systemTests.exec(this, {
        spec: 'plugins_config_extras.cy.js',
        config: {
          env: {
            projectRoot: e2eProject,
            configFile: path.join(e2eProject, 'cypress.config.js'),
          },
        },
      })
    })

    it('passes custom configFile to plugins function', function () {
      return systemTests.exec(this, {
        spec: 'plugins_config_extras.cy.js',
        configFile: 'cypress-alt.config.js',
        config: {
          env: {
            projectRoot: e2eProject,
            configFile: path.join(e2eProject, 'cypress-alt.config.js'),
          },
        },
      })
    })
  })
})
