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
    spec: 'app_spec.js',
    project: 'plugins-root-async-error',
    expectedExitCode: 1,
    onRun (exec) {
      return exec().then(({ stdout }) => {
        expect(stdout).to.include('The following error was thrown by a plugin. We stopped running your tests because a plugin crashed. Please check your plugins file')
        expect(stdout).to.include('Error: Root async error from plugins file')
      })
    },
  })

  it('fails when there is an async error inside an event handler', function () {
    return systemTests.exec(this, {
      spec: 'app_spec.js',
      project: 'plugins-async-error',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
      config: {
        video: false,
      },
    })
  })

  it('can modify config from plugins', function () {
    return systemTests.exec(this, {
      spec: 'app_spec.js',
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
    spec: 'app_spec.js',
    headed: true,
    project: 'plugin-extension',
    sanitizeScreenshotDimensions: true,
    snapshot: true,
  })

  it('handles absolute path to pluginsFile', function () {
    const pluginsAbsolutePath = Fixtures.projectPath('plugins-absolute-path')

    return systemTests.exec(this, {
      spec: 'absolute_spec.js',
      config: {
        pluginsFile: path.join(
          pluginsAbsolutePath,
          'cypress/plugins/index.js',
        ),
      },
      project: 'plugins-absolute-path',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })
  })

  const pluginAfterScreenshot = 'plugin-after-screenshot'

  it('calls after:screenshot for cy.screenshot() and failure screenshots', function () {
    return systemTests.exec(this, {
      spec: 'after_screenshot_spec.js',
      project: pluginAfterScreenshot,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  // https://github.com/cypress-io/cypress/issues/8079
  it('does not report more screenshots than exist if user overwrites previous screenshot in afterScreenshot', function () {
    return systemTests.exec(this, {
      spec: 'after_screenshot_overwrite_spec.js',
      project: pluginAfterScreenshot,
      snapshot: true,
    })
  })

  it('fails when invalid event is registered', function () {
    return systemTests.exec(this, {
      spec: 'app_spec.js',
      project: 'plugin-validation-error',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('fails when there is no function exported', function () {
    return systemTests.exec(this, {
      spec: 'app_spec.js',
      project: 'plugin-empty',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  describe('preprocessor', function () {
    it('passes with working preprocessor', function () {
      return systemTests.exec(this, {
        spec: 'app_spec.js',
        project: 'working-preprocessor',
        sanitizeScreenshotDimensions: true,
        snapshot: true,
      })
    })

    it('supports node builtins', function () {
      return systemTests.exec(this, {
        spec: 'node_builtins_spec.js',
      })
    })

    // https://github.com/cypress-io/cypress/issues/8361
    it('supports .mjs files', function () {
      return systemTests.exec(this, {
        spec: 'mjs_spec.mjs',
      })
    })
  })

  describe('extra properties', function () {
    it('passes projectRoot and default configFile to plugins function', function () {
      return systemTests.exec(this, {
        spec: 'plugins_config_extras_spec.js',
        config: {
          env: {
            projectRoot: e2eProject,
            configFile: path.join(e2eProject, 'cypress.json'),
          },
        },
      })
    })

    it('passes custom configFile to plugins function', function () {
      return systemTests.exec(this, {
        spec: 'plugins_config_extras_spec.js',
        configFile: 'cypress-alt.json',
        config: {
          env: {
            projectRoot: e2eProject,
            configFile: path.join(e2eProject, 'cypress-alt.json'),
          },
        },
      })
    })

    it('passes false configFile to plugins function', function () {
      return systemTests.exec(this, {
        spec: 'plugins_config_extras_spec.js',
        configFile: 'false',
        config: {
          env: {
            projectRoot: e2eProject,
            configFile: false,
          },
        },
      })
    })
  })
})
